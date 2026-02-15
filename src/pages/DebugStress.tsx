import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { FadeIn } from "@/components/ui/motion";
import { useCreateBulkExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes"; // Using this to get a list or just use manual rpc/insert
import { supabase } from "@/lib/backendClient";
import { subMonths, format, addDays } from "date-fns";
import { Loader2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const DebugStress = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalRecords] = useState(5000);
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

    const emotions = ["pilar", "essencial", "impulso"];

    const runSimulation = async () => {
        if (!user) {
            toast.error("Usuário não autenticado");
            return;
        }

        setLoading(true);
        setStatus("running");
        setProgress(0);

        try {
            // 1. Fetch real categories to make the dashboard look real
            const { data: userCategories } = await supabase
                .from("categories")
                .select("id, name")
                .eq("user_id", user.id);

            const batchSize = 500;
            const totalBatches = totalRecords / batchSize;

            for (let b = 0; b < totalBatches; b++) {
                const batchData = [];

                for (let i = 0; i < batchSize; i++) {
                    const isExpense = Math.random() > 0.05; // 95% expenses
                    const randomDays = Math.floor(Math.random() * 180); // Last 6 months
                    const baseDate = subMonths(new Date(), Math.floor(randomDays / 30));
                    const adjustedDate = addDays(baseDate, Math.floor(Math.random() * 28));

                    if (isExpense) {
                        const randomCat = userCategories && userCategories.length > 0
                            ? userCategories[Math.floor(Math.random() * userCategories.length)]
                            : null;

                        batchData.push({
                            user_id: user.id,
                            amount: parseFloat((Math.random() * 200 + 10).toFixed(2)),
                            description: `Gasto Simulado ${b * batchSize + i}`,
                            category_id: randomCat?.id || null,
                            emotion: emotions[Math.floor(Math.random() * emotions.length)],
                            date: format(adjustedDate, "yyyy-MM-dd"),
                            status: "confirmed",
                            source: "manual",
                            is_installment: false,
                        });
                    }
                }

                if (batchData.length > 0) {
                    const { error } = await supabase.from("expenses").insert(batchData);
                    if (error) throw error;
                }

                // Add some major incomes for each month in the range
                if (b % 2 === 0) { // Every 1000 records, add some salaries
                    const incomeData = [];
                    for (let m = 0; m < 6; m++) {
                        const date = subMonths(new Date(), m);
                        incomeData.push({
                            user_id: user.id,
                            amount: 6500,
                            description: "Salário Mensal Principal",
                            date: format(date, "yyyy-MM-01"),
                            type: "salary",
                            is_recurring: true,
                        });
                    }
                    await supabase.from("incomes").insert(incomeData);
                }

                const currentProgress = Math.round(((b + 1) / totalBatches) * 100);
                setProgress(currentProgress);
            }

            setStatus("success");
            toast.success("5.000 registros inseridos com sucesso!");
        } catch (error: any) {
            console.error("Stress Test Error:", error);
            setStatus("error");
            toast.error(`Falha na simulação: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const clearData = async () => {
        if (!confirm("Isso apagará TODOS os seus gastos e receitas. Tem certeza?")) return;

        setLoading(true);
        try {
            const { error: e1 } = await supabase.from("expenses").delete().eq("user_id", user?.id);
            const { error: e2 } = await supabase.from("incomes").delete().eq("user_id", user?.id);

            if (e1 || e2) throw e1 || e2;

            toast.success("Dados limpos com sucesso!");
            setStatus("idle");
            setProgress(0);
        } catch (error: any) {
            toast.error("Erro ao limpar dados");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
                <FadeIn className="max-w-md w-full space-y-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Database className="w-10 h-10 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif font-bold">Simulador de Estresse</h1>
                        <p className="text-muted-foreground">
                            Esta ferramenta irá inserir 5.000 registros de transações para testar a performance e escala do Saldin.
                        </p>
                    </div>

                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {(status === "idle" || status === "error") && (
                            <div className="space-y-6 relative z-10">
                                <Button
                                    onClick={runSimulation}
                                    variant="warm"
                                    size="xl"
                                    className="w-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 animate-spin h-6 w-6" />
                                    ) : (
                                        "Iniciar Simulação (5.000)"
                                    )}
                                </Button>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={clearData}
                                        className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                                        disabled={loading}
                                    >
                                        Limpar Todos os Dados
                                    </Button>
                                </div>
                            </div>
                        )}

                        {status === "running" && (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Processando registros...</span>
                                    <span className="font-bold">{progress}%</span>
                                </div>
                                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground animate-pulse">
                                    Inserindo lotes no Supabase. Não feche a aba.
                                </p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="space-y-4 py-4">
                                <CheckCircle2 className="w-16 h-16 text-essential mx-auto" />
                                <h3 className="text-xl font-bold">Simulação Concluída!</h3>
                                <p className="text-sm text-muted-foreground">
                                    A base de dados agora contém 5.000 transações simuladas.
                                </p>
                                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                                    Ver Dashboard
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-4 py-4">
                                <AlertCircle className="w-16 h-16 text-impulse mx-auto" />
                                <h3 className="text-xl font-bold">Erro na Simulação</h3>
                                <Button onClick={() => setStatus("idle")} variant="outline" className="w-full">
                                    Tentar Novamente
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" onClick={() => navigate("/")}>
                        Voltar para o App
                    </Button>
                </FadeIn>
            </div>
        </AppLayout>
    );
};

export default DebugStress;

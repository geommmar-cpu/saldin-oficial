import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn, PageTransition } from "@/components/ui/motion";
import {
    Plus,
    CreditCard,
    ChevronRight,
    Loader2,
    Tag,
    ChevronLeft,
    Calendar,
    AlertCircle,
    TrendingDown,
    Clock,
    Landmark,
    Trash2,
    Ban
} from "lucide-react";
import { useSubscriptions, useUpdateSubscription } from "@/hooks/useSubscriptions";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import { BankLogo } from "@/components/BankLogo";

export default function Subscriptions() {
    const navigate = useNavigate();
    const { data: subscriptions = [], isLoading } = useSubscriptions();
    const updateSub = useUpdateSubscription();

    const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);
    const cancelledSubs = useMemo(() => subscriptions.filter(s => s.status === 'cancelled'), [subscriptions]);

    const totalMonthly = useMemo(() => {
        return activeSubs.reduce((sum, s) => {
            if (s.frequency === 'monthly') return sum + Number(s.amount);
            if (s.frequency === 'yearly') return sum + (Number(s.amount) / 12);
            return sum + Number(s.amount); // Simplificação
        }, 0);
    }, [activeSubs]);

    const handleToggleStatus = (id: string, currentStatus: string) => {
        updateSub.mutate({
            id,
            status: currentStatus === 'active' ? 'cancelled' : 'active'
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Deseja realmente excluir esta assinatura?")) {
            updateSub.mutate({ id, active: false });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
                <div className="pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="-ml-2">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <FadeIn>
                            <div>
                                <h1 className="font-serif text-xl font-semibold">Assinaturas</h1>
                                <p className="text-sm text-muted-foreground">
                                    Seus gastos recorrentes
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                    <Button
                        onClick={() => navigate("/subscriptions/add")}
                        size="sm"
                        className="gap-1 rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        Nova
                    </Button>
                </div>
            </header>

            <main className="px-5 space-y-6 pt-6">
                {/* Insights Section */}
                <FadeIn delay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Custo Mensal</p>
                                    <p className="font-serif text-2xl font-bold text-primary">
                                        {formatCurrency(totalMonthly)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Total Anual:</span>
                                <span className="font-bold">{formatCurrency(totalMonthly * 12)}</span>
                            </div>
                        </Card>

                        <Card className="p-5 bg-secondary/20 border-none">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Próximos 7 dias</p>
                                    <p className="font-bold text-sm">
                                        {activeSubs.filter(s => {
                                            const day = new Date().getDate();
                                            return s.billing_date >= day && s.billing_date <= day + 7;
                                        }).length} cobranças previstas
                                    </p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${Math.min((activeSubs.length / 10) * 100, 100)}%` }}
                                />
                            </div>
                        </Card>
                    </div>
                </FadeIn>

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ativas</h2>
                        <span className="text-xs text-muted-foreground">{activeSubs.length}</span>
                    </div>

                    <div className="space-y-3">
                        {activeSubs.length === 0 ? (
                            <div className="py-12 text-center bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
                                <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">Nenhuma assinatura ativa</p>
                            </div>
                        ) : (
                            activeSubs.map((sub, index) => (
                                <FadeIn key={sub.id} delay={0.15 + (index * 0.05)}>
                                    <Card
                                        variant="interactive"
                                        className="p-4 border-none shadow-soft hover:shadow-medium bg-secondary/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <BankLogo bankName={sub.name} className="w-12 h-12 rounded-xl shadow-sm bg-white" />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h3 className="font-bold text-base truncate">{sub.name}</h3>
                                                    <span className="font-bold text-primary text-base">
                                                        {formatCurrency(sub.amount)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    {sub.category && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px]">
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {sub.category.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Dia {sub.billing_date}
                                                    </div>
                                                    <span>·</span>
                                                    <div className="flex items-center gap-1">
                                                        {sub.card_id ? (
                                                            <><CreditCard className="w-3 h-3" /> {sub.card?.card_name || 'Cartão'}</>
                                                        ) : (
                                                            <><Landmark className="w-3 h-3" /> {sub.bank_account?.bank_name || 'Conta'}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleStatus(sub.id, 'active');
                                                    }}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </FadeIn>
                            ))
                        )}
                    </div>
                </div>

                {/* Cancelled Section */}
                {cancelledSubs.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h2 className="px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Canceladas / Pausadas</h2>
                        <div className="space-y-3 opacity-60">
                            {cancelledSubs.map((sub) => (
                                <Card key={sub.id} className="p-4 bg-muted/50 border-none flex items-center gap-4">
                                    <BankLogo bankName={sub.name} className="w-10 h-10 grayscale rounded-lg" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-sm line-through">{sub.name}</h3>
                                        <p className="text-xs text-muted-foreground">{formatCurrency(sub.amount)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-primary"
                                        onClick={() => handleToggleStatus(sub.id, 'cancelled')}
                                    >
                                        Reativar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(sub.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}

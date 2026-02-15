import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    PieChart as PieIcon,
    BarChart3,
    LayoutGrid,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExpenses } from "@/hooks/useExpenses";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { defaultCategories, categoryGroups, type CategoryGroup } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useAllCategories } from "@/hooks/useCategories";

const COLORS = [
    "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B",
    "#EC4899", "#14B8A6", "#6366F1", "#94A3B8"
];

export default function Reports() {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<"category" | "group">("group");

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const prevMonthStart = startOfMonth(subMonths(selectedMonth, 1));
    const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1));

    // Current month data
    const { data: expenses = [] } = useExpenses();
    const { data: installments = [] } = useCardInstallmentsByMonth(format(selectedMonth, "yyyy-MM"));

    // Prev month data (to compare)
    const { data: prevInstallments = [] } = useCardInstallmentsByMonth(format(subMonths(selectedMonth, 1), "yyyy-MM"));

    const { allCategories } = useAllCategories();

    // Aggregate current month
    const reportData = useMemo(() => {
        // 1. Manual expenses for current month
        const monthExpenses = expenses.filter(e =>
            e.status !== "deleted" &&
            isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
        );

        // 2. Sum everything by category ID
        const categoryTotals: Record<string, number> = {};

        monthExpenses.forEach(e => {
            const catId = e.category_id || "outros";
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(e.amount);
        });

        installments.forEach(i => {
            // For installments, we should try to find the category from the purchase
            // Purchases are linked to installments, but the hook might not return it directly. 
            // Assuming i.purchases.category_id if available, else others.
            const catId = (i as any).purchases?.category_id || "outros";
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(i.amount);
        });

        // 3. Group by what user selected
        const groupedData: Record<string, { total: number; name: string; color: string }> = {};

        Object.entries(categoryTotals).forEach(([catId, amount]) => {
            // Find category by ID (UUID or slug)
            // Fallback: try by name 'Outros', then first available, then hardcoded fallback
            const cat = allCategories.find(c => c.id === catId) ||
                allCategories.find(c => c.name.toLowerCase() === "outros") ||
                allCategories[0];

            if (!cat) return;

            const key = viewMode === "group" ? (cat.group || "outros") : cat.id;
            const name = viewMode === "group" ? (categoryGroups[cat.group as CategoryGroup]?.name || "Outros") : cat.name;
            const color = viewMode === "group" ? (cat.color || "#3B82F6") : (cat.color || "#3B82F6");

            if (!groupedData[key]) {
                groupedData[key] = { total: 0, name: name || "Outros", color: color };
            }
            groupedData[key].total += amount;
        });

        const totalMonth = Object.values(groupedData).reduce((acc, curr) => acc + curr.total, 0);

        return Object.entries(groupedData)
            .map(([id, info]) => ({
                id,
                ...info,
                percentage: totalMonth > 0 ? (info.total / totalMonth) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);
    }, [expenses, installments, selectedMonth, viewMode, allCategories]);

    // Comparison logic
    const comparison = useMemo(() => {
        const totalCurrent = reportData.reduce((acc, curr) => acc + curr.total, 0);

        // Quick prev month calc
        const prevExpenses = expenses.filter(e =>
            e.status !== "deleted" &&
            isWithinInterval(new Date(e.date), { start: prevMonthStart, end: prevMonthEnd })
        );
        const totalPrevExpenses = prevExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalPrevInstallments = prevInstallments.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalPrev = totalPrevExpenses + totalPrevInstallments;

        if (totalPrev === 0) return { diff: 0, trend: "neutral" };

        const diff = totalCurrent - totalPrev;
        const diffPercent = (diff / totalPrev) * 100;

        return {
            diff,
            diffPercent,
            trend: diff > 0 ? "up" : "down",
            totalPrev
        };
    }, [reportData, expenses, prevInstallments, prevMonthStart, prevMonthEnd]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);

    const prevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
    const nextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
                <div className="pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-serif text-xl font-semibold">Relatórios</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={viewMode === "group" ? "warm" : "ghost"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewMode("group")}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Grupos
                        </Button>
                        <Button
                            variant={viewMode === "category" ? "warm" : "ghost"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setViewMode("category")}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Categorias
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-5 space-y-6">
                {/* Month Selector */}
                <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/50 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            {format(selectedMonth, "MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground">{format(selectedMonth, "yyyy")}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Total & Comparison */}
                <FadeIn>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 shadow-sm">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Gasto Total no Mês</p>
                            <div className="flex items-end justify-between">
                                <h2 className="text-3xl font-bold tracking-tighter">
                                    {formatCurrency(reportData.reduce((acc, curr) => acc + curr.total, 0))}
                                </h2>
                                {comparison.totalPrev > 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                                        comparison.trend === "up" ? "text-impulse bg-impulse/10" : "text-essential bg-essential/10"
                                    )}>
                                        {comparison.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(comparison.diffPercent).toFixed(1)}% vs mês ant.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* Pie Chart */}
                <FadeIn delay={0.1}>
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <PieIcon className="w-4 h-4" />
                            </div>
                            <h3 className="font-serif text-lg font-semibold">Distribuição de Gastos</h3>
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reportData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="total"
                                    >
                                        {reportData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {reportData.slice(0, 4).map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }} />
                                    <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                                    <span className="text-xs font-bold">{item.percentage.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* Bar Chart */}
                <FadeIn delay={0.2}>
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <h3 className="font-serif text-lg font-semibold">Maiores Gastos</h3>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.slice(0, 6)} layout="vertical" margin={{ left: -20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 500 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        radius={[0, 4, 4, 0]}
                                        fill="#3B82F6"
                                        barSize={20}
                                    >
                                        {reportData.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </FadeIn>

                {/* List Details */}
                <FadeIn delay={0.3}>
                    <div className="space-y-3">
                        <h3 className="px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detalhamento</h3>
                        <div className="space-y-2">
                            {reportData.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl bg-card border border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.color }} />
                                        <div>
                                            <p className="text-sm font-bold">{item.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                                {item.percentage.toFixed(1)}% do total
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold">{formatCurrency(item.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </main>

            <BottomNav />
        </div>
    );
}

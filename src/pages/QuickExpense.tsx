import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths } from "date-fns";
import {
    ArrowLeft, QrCode, Banknote, Smartphone, CreditCard,
    Calendar, User, Check, Minus, Plus, Loader2,
    RepeatIcon, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import { parseCurrency, formatCurrencyInput } from "@/lib/currency";
import { toLocalDateString } from "@/lib/dateUtils";
import { supabase } from "@/lib/backendClient";
import { defaultCategories } from "@/lib/categories";

import { useAuth } from "@/hooks/useAuth";
import { useAllCategories } from "@/hooks/useCategories";
import { useBankAccounts, useUpdateBankBalance } from "@/hooks/useBankAccounts";
import { useCreditCards, useCreateCreditCardPurchase } from "@/hooks/useCreditCards";
import { useCreateExpense, useCreateBulkExpenses } from "@/hooks/useExpenses";
import { useCreateReceivable } from "@/hooks/useReceivables";
import { useCashAccount } from "@/hooks/useCashAccount";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { BankLogo } from "@/components/BankLogo";

// ── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "pix" | "cash" | "debit" | "credit";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; Icon: React.ElementType }[] = [
    { value: "pix", label: "PIX", Icon: QrCode },
    { value: "cash", label: "Dinheiro", Icon: Banknote },
    { value: "debit", label: "Débito", Icon: Smartphone },
    { value: "credit", label: "Crédito", Icon: CreditCard },
];

// Slugs das categorias mais usadas em gastos do dia a dia
const QUICK_CAT_IDS = [
    "supermercado",
    "restaurantes_ifood",
    "uber_apps",
    "combustivel",
    "cafe_lanches",
    "farmacia",
    "cinema_shows",
    "outros",
];

function isValidUuid(s: string | null | undefined): boolean {
    if (!s) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const QuickExpense = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { allCategories, isLoading: catsLoading } = useAllCategories();
    const { data: bankAccounts = [] } = useBankAccounts();
    const { data: creditCards = [] } = useCreditCards();
    const { ensureCashAccount } = useCashAccount();

    const createExpense = useCreateExpense();
    const createBulkExpenses = useCreateBulkExpenses();
    const createCreditCardPurchase = useCreateCreditCardPurchase();
    const updateBankBalance = useUpdateBankBalance();
    const createReceivable = useCreateReceivable();

    // ── Form state ──────────────────────────────────────────────────────────────
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState<string | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
    const [selectedBankId, setSelectedBankId] = useState<string | undefined>(bankAccounts[0]?.id);
    const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
    const [date, setDate] = useState(toLocalDateString());
    const [description, setDescription] = useState("");

    // Installments / recurrence
    const [installments, setInstallments] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);

    // Third-party
    const [isForOtherPerson, setIsForOtherPerson] = useState(false);
    const [reimbName, setReimbName] = useState("");
    const [reimbAmount, setReimbAmount] = useState("");
    const [reimbDate, setReimbDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return toLocalDateString(d);
    });

    // UI
    const [showKeypad, setShowKeypad] = useState(true);
    const keypadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const catScrollRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-hide keypad 1.5s after last keystroke
    const handleAmountChange = useCallback((val: string) => {
        setAmount(val);
        setShowKeypad(true);
        if (keypadTimerRef.current) clearTimeout(keypadTimerRef.current);
        keypadTimerRef.current = setTimeout(() => setShowKeypad(false), 1500);
    }, []);

    // ── Derived values ───────────────────────────────────────────────────────────
    const numericAmount = parseCurrency(amount);
    const selectedCategory = categoryId ? allCategories.find(c => c.id === categoryId) : undefined;

    // All categories carousel: quick picks first, then the rest
    const sourceList = allCategories.length > 0 ? allCategories : defaultCategories;
    const quickSet = new Set(QUICK_CAT_IDS);
    const quickFirst = QUICK_CAT_IDS
        .map(slug => sourceList.find(c => c.id === slug))
        .filter(Boolean) as typeof allCategories;
    const remaining = sourceList.filter(c => !quickSet.has(c.id));
    const orderedCategories = [...quickFirst, ...remaining];

    const isCreditCard = paymentMethod === "credit" && !!selectedCardId;
    const canSubmit = numericAmount > 0 && !!paymentMethod &&
        (paymentMethod === "credit" ? !!selectedCardId : true);

    // ── Reimbursement shortcuts ──────────────────────────────────────────────────
    const setReimbFraction = (frac: number) => {
        if (!numericAmount) return;
        const val = Math.round(numericAmount * frac * 100);
        setReimbAmount(formatCurrencyInput(String(val)));
    };

    // ── UUID resolver ────────────────────────────────────────────────────────────
    async function resolveCategoryId(id: string | undefined): Promise<string | null> {
        if (!id || !user) return null;
        if (isValidUuid(id) && id.length >= 30) return id;

        const cat = allCategories.find(c => c.id === id);
        if (!cat) return null;

        const { data: existing } = await supabase
            .from("categories").select("id")
            .ilike("name", cat.name).eq("user_id", user.id).maybeSingle();
        if (existing) return existing.id;

        const { data: created } = await supabase.from("categories").insert({
            user_id: user.id, name: cat.name, icon: "Tag", color: cat.color,
            type: "expense", group_name: cat.group, nature: cat.nature as any,
            is_default: true, allow_expense: cat.allowExpense ?? true,
            allow_card: cat.allowCard ?? true, allow_subscription: cat.allowSubscription ?? true,
        }).select().single();

        return created?.id ?? null;
    }

    // ── Save ─────────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!canSubmit || !user || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const finalCategoryId = await resolveCategoryId(categoryId);

            if (isCreditCard) {
                await createCreditCardPurchase.mutateAsync({
                    card_id: selectedCardId!,
                    description: description || selectedCategory?.name || "Compra no cartão",
                    total_amount: numericAmount,
                    total_installments: installments,
                    category_id: finalCategoryId,
                    purchase_date: date,
                });
            } else {
                let bankId = selectedBankId;
                if (paymentMethod === "cash") bankId = await ensureCashAccount();

                const purchaseDate = new Date(date + "T12:00:00");
                const totalInstalls = installments > 1 ? installments : 1;

                if (totalInstalls > 1) {
                    const groupId = crypto.randomUUID();
                    await createBulkExpenses.mutateAsync(
                        Array.from({ length: totalInstalls }, (_, i) => ({
                            amount: numericAmount,
                            description: description || selectedCategory?.name || "Gasto",
                            status: "confirmed" as const,
                            source: "manual" as const,
                            is_installment: false,
                            total_installments: totalInstalls,
                            installment_number: i + 1,
                            installment_group_id: groupId,
                            bank_account_id: bankId ?? undefined,
                            date: format(addMonths(purchaseDate, i), "yyyy-MM-dd"),
                            category_id: finalCategoryId,
                        })) as any
                    );
                } else {
                    await createExpense.mutateAsync({
                        amount: numericAmount,
                        description: description || selectedCategory?.name || "Gasto",
                        status: "confirmed",
                        source: "manual",
                        is_installment: false,
                        installment_number: 1,
                        bank_account_id: bankId ?? undefined,
                        date,
                        category_id: finalCategoryId,
                    } as any);
                }

                if (bankId) {
                    await updateBankBalance.mutateAsync({ accountId: bankId, delta: -numericAmount });
                }
            }

            if (isForOtherPerson && reimbName.trim()) {
                const reimbValue = parseCurrency(reimbAmount) || numericAmount;
                await createReceivable.mutateAsync({
                    debtor_name: reimbName.trim(),
                    amount: reimbValue,
                    description: `Reembolso – ${description || selectedCategory?.name || "Gasto"}`,
                    due_date: reimbDate,
                    status: "pending",
                });
            }

            setShowSuccess(true);
            setTimeout(() => navigate("/", { state: { success: true } }), 1800);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Erro ao salvar. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success ──────────────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 14 }}
                    className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center"
                >
                    <Check className="w-12 h-12 text-green-500" strokeWidth={2.5} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                    <p className="text-2xl font-bold">Gasto registrado!</p>
                    <p className="text-muted-foreground mt-1">{formatCurrency(numericAmount)} debitado</p>
                    {isForOtherPerson && reimbName && (
                        <p className="text-sm text-primary font-medium mt-2">
                            💬 Valor a receber criado para {reimbName}
                        </p>
                    )}
                </motion.div>
            </div>
        );
    }

    // ── Keypad height: ~284px. Bottom button: ~72px. Total fixed: ~356px. ────────
    const keypadOpen = showKeypad;
    const bottomOffset = keypadOpen ? "pb-[370px]" : "pb-24";

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-border">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="font-bold text-base flex-1">Novo Gasto</h1>
            </div>

            {/* Scrollable form */}
            <div className={cn("flex-1 overflow-y-auto pt-4 space-y-5", bottomOffset)}>

                {/* ── Amount ── */}
                <div className="px-4">
                    <button
                        onClick={() => setShowKeypad(v => !v)}
                        className="w-full text-center py-3 rounded-2xl bg-card border border-border"
                    >
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Valor do Gasto</p>
                        <p className={cn(
                            "text-5xl font-bold tabular-nums tracking-tight",
                            numericAmount > 0 ? "text-foreground" : "text-muted-foreground/30"
                        )}>
                            {amount ? formatCurrency(numericAmount) : "R$ 0,00"}
                        </p>
                        <p className="text-[10px] text-primary mt-1 font-medium">
                            {showKeypad ? "▼ Fechar teclado" : "▲ Abrir teclado"}
                        </p>
                    </button>
                </div>

                {/* ── Categories carousel: full-bleed horizontal scroll ── */}
                <section>
                    <div className="px-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            Categoria {selectedCategory && <span className="normal-case font-normal text-primary">· {selectedCategory.name}</span>}
                        </p>
                    </div>

                    <div
                        ref={catScrollRef}
                        className="flex gap-2 pb-2"
                        style={{
                            overflowX: "auto",
                            overflowY: "hidden",
                            scrollbarWidth: "none",
                            WebkitOverflowScrolling: "touch" as any,
                            touchAction: "pan-x",
                            paddingLeft: "1rem",
                            paddingRight: "1rem",
                        }}
                    >
                        {(catsLoading && orderedCategories.length === 0
                            ? Array.from({ length: 8 })
                            : orderedCategories
                        ).map((cat, i) => {
                            if (!cat) {
                                return <div key={i} className="flex-shrink-0 w-[70px] h-[72px] rounded-2xl bg-muted animate-pulse" />;
                            }
                            const Icon = (cat as typeof allCategories[0]).icon;
                            const c = cat as typeof allCategories[0];
                            const isSelected = categoryId === c.id;
                            const isQuick = quickSet.has(c.id);
                            return (
                                <motion.button
                                    key={c.id}
                                    whileTap={{ scale: 0.91 }}
                                    onClick={() => setCategoryId(isSelected ? undefined : c.id)}
                                    style={{ flexShrink: 0, minWidth: 70 }}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border transition-all relative",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                                            : "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    {isQuick && !isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
                                    )}
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[9px] font-bold text-center leading-tight w-14 line-clamp-2">{c.name}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Payment method ── */}
                <section className="px-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</p>
                    <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_OPTIONS.map(({ value, label, Icon }) => {
                            const isSelected = paymentMethod === value;
                            return (
                                <motion.button
                                    key={value}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                        setPaymentMethod(value);
                                        setSelectedCardId(undefined);
                                        if (value !== "credit") setInstallments(1);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold">{label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Account / Card ── */}
                <AnimatePresence>
                    {paymentMethod && paymentMethod !== "cash" && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                {paymentMethod === "credit" ? "Cartão" : "Conta"}
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {paymentMethod === "credit"
                                    ? creditCards.map(card => (
                                        <motion.button key={card.id} whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedCardId(card.id)}
                                            className={cn(
                                                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                                                selectedCardId === card.id ? "border-primary bg-primary/10" : "border-border bg-card"
                                            )}>
                                            <BankLogo bankName={card.card_name || card.bank} className="w-6 h-6" size="sm" />
                                            <span className="text-xs font-medium max-w-[90px] truncate">{card.card_name || card.bank}</span>
                                        </motion.button>
                                    ))
                                    : bankAccounts.map(acc => (
                                        <motion.button key={acc.id} whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedBankId(acc.id)}
                                            className={cn(
                                                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                                                selectedBankId === acc.id ? "border-primary bg-primary/10" : "border-border bg-card"
                                            )}>
                                            <BankLogo bankName={acc.bank_name} className="w-6 h-6" size="sm" />
                                            <div className="text-left">
                                                <p className="text-[11px] font-semibold max-w-[80px] truncate">{acc.bank_name}</p>
                                                <p className="text-[9px] text-muted-foreground">{formatCurrency(Number(acc.current_balance))}</p>
                                            </div>
                                        </motion.button>
                                    ))
                                }
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ── Credit: Installments ── */}
                <AnimatePresence>
                    {paymentMethod === "credit" && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-2xl border border-border p-3 mx-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold">Parcelas</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setInstallments(v => Math.max(1, v - 1))}
                                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-base font-bold w-8 text-center">{installments}x</span>
                                    <button onClick={() => setInstallments(v => Math.min(48, v + 1))}
                                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            {installments > 1 && numericAmount > 0 && (
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {installments}× de {formatCurrency(numericAmount / installments)}/mês
                                </p>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ── Recorrente (non-credit only) ── */}
                <AnimatePresence>
                    {paymentMethod && paymentMethod !== "credit" && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4"
                        >
                            <button
                                onClick={() => setIsRecurring(v => !v)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all",
                                    isRecurring ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <RepeatIcon className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Gasto recorrente</span>
                                </div>
                                <span className="text-xs font-bold">{isRecurring ? "Sim ✓" : "Não"}</span>
                            </button>

                            <AnimatePresence>
                                {isRecurring && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-2"
                                    >
                                        <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
                                            <p className="text-xs text-muted-foreground">Quantas vezes se repete?</p>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setInstallments(v => Math.max(2, v - 1))}
                                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-base font-bold w-16 text-center">{installments} meses</span>
                                                <button onClick={() => setInstallments(v => Math.min(36, v + 1))}
                                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ── Date & Description ── */}
                <section className="flex gap-2 px-4">
                    <div className="flex-1 flex items-center gap-2 p-3 bg-card rounded-xl border border-border">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                            type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-medium outline-none min-w-0"
                        />
                    </div>
                </section>

                <section className="px-4">
                    <input
                        type="text" value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="w-full p-3 bg-card rounded-xl border border-border text-sm outline-none placeholder:text-muted-foreground/40"
                    />
                </section>

                {/* ── Gasto meu / Para outra pessoa ── */}
                <section className="rounded-2xl border border-border overflow-hidden bg-card mx-4">
                    {/* Toggle header */}
                    <div className="flex">
                        <button
                            onClick={() => setIsForOtherPerson(false)}
                            className={cn(
                                "flex-1 py-3.5 text-sm font-bold transition-all",
                                !isForOtherPerson ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}
                        >
                            ✓ Gasto meu
                        </button>
                        <button
                            onClick={() => setIsForOtherPerson(true)}
                            className={cn(
                                "flex-1 py-3.5 text-sm font-bold transition-all",
                                isForOtherPerson ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}
                        >
                            👤 Para outra pessoa
                        </button>
                    </div>

                    {/* Third-party fields */}
                    <AnimatePresence>
                        {isForOtherPerson && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-border"
                            >
                                <div className="p-4 space-y-3">
                                    {/* Name */}
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-xl">
                                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <input
                                            type="text" value={reimbName} onChange={e => setReimbName(e.target.value)}
                                            placeholder="Nome da pessoa"
                                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                                        />
                                    </div>

                                    {/* Partial amount */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-1 ml-1">Valor a receber de volta</p>
                                        <input
                                            type="text" value={reimbAmount} onChange={e => setReimbAmount(e.target.value)}
                                            placeholder={`Total: ${amount || "R$ 0,00"}`}
                                            className="w-full p-2.5 bg-muted rounded-xl text-sm outline-none placeholder:text-muted-foreground/40"
                                        />
                                        {numericAmount > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {[{ label: "50%", frac: 0.5 }, { label: "33%", frac: 1 / 3 }, { label: "25%", frac: 0.25 }].map(({ label, frac }) => (
                                                    <button
                                                        key={label}
                                                        onClick={() => setReimbFraction(frac)}
                                                        className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold"
                                                    >
                                                        {label} – {formatCurrency(numericAmount * frac)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Due date */}
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-xl">
                                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <input
                                            type="date" value={reimbDate} onChange={e => setReimbDate(e.target.value)}
                                            className="flex-1 bg-transparent text-xs outline-none"
                                        />
                                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">previsão devolução</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Bottom spacer */}
                <div className="h-4 px-4" />
            </div>

            {/* ── Fixed bottom: keypad + button ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
                <AnimatePresence>
                    {showKeypad && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pt-3">
                                <NumericKeypad value={amount} onChange={handleAmountChange} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="px-4 py-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit || isSubmitting}
                        className={cn(
                            "w-full h-14 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                            canSubmit && !isSubmitting
                                ? "bg-primary text-primary-foreground shadow-primary/25"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <><Check className="w-5 h-5" /> Registrar Gasto</>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default QuickExpense;

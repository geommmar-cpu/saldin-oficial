import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft,
    CreditCard,
    Landmark,
    Calendar as CalendarIcon,
    DollarSign,
    Tag,
    Loader2,
    CheckCircle2,
    Sparkles,
    Search,
    Info,
    ArrowRight
} from "lucide-react";
import { FadeIn, PageTransition } from "@/components/ui/motion";
import { useCreateSubscription } from "@/hooks/useSubscriptions";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useAllCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency, formatCurrencyInput } from "@/lib/currency";
import { BankLogo } from "@/components/BankLogo";

const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
    }
};

const STEPS = {
    BASIC_INFO: 1,
    PAYMENT: 2,
    REVIEW: 3
};

const SERVICE_CATEGORIES: Record<string, string> = {
    "netflix": "assinaturas_lazer",
    "spotify": "assinaturas_lazer",
    "prime video": "assinaturas_lazer",
    "amazon prime": "assinaturas_lazer",
    "hbo": "assinaturas_lazer",
    "disney": "assinaturas_lazer",
    "youtube": "assinaturas_lazer",
    "apple": "assinaturas_lazer",
    "globo": "assinaturas_lazer",
    "smartfit": "academia",
    "bluefit": "academia",
    "totalpass": "academia",
    "gympass": "academia",
    "vivo": "internet_tv_tel",
    "claro": "internet_tv_tel",
    "tim": "internet_tv_tel",
    "oi": "internet_tv_tel",
    "sabesp": "agua_saneamento",
    "enel": "energia_eletrica",
    "cpfl": "energia_eletrica",
    "sem parar": "transporte_publico",
    "veloe": "transporte_publico",
    "conectcar": "transporte_publico",
    "chatgpt": "educacao_geral",
    "midjourney": "educacao_geral",
    "adobe": "educacao_geral",
};

export default function AddSubscription() {
    const navigate = useNavigate();
    const createSub = useCreateSubscription();
    const { data: cards = [] } = useCreditCards();
    const { data: accounts = [] } = useBankAccounts();
    const { allCategories } = useAllCategories();

    const [currentStep, setCurrentStep] = useState(STEPS.BASIC_INFO);
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        billing_date: new Date().getDate(),
        frequency: "monthly" as any,
        payment_type: "card" as "card" | "account",
        payment_id: "",
        category_id: ""
    });

    // Auto-select category
    useEffect(() => {
        if (!formData.name) return;

        const lowerName = formData.name.toLowerCase();
        // Check for exact headers or partial matches
        for (const [key, catId] of Object.entries(SERVICE_CATEGORIES)) {
            if (lowerName.includes(key)) {
                // Determine if we should override. Only if category is empty or was auto-set (we'd need to track that, but for now simple overwrite if empty)
                if (!formData.category_id) {
                    // Start search in all categories to find the ID (some might be custom)
                    const category = allCategories.find(c => c.id === catId || c.name.toLowerCase() === key);
                    if (category) {
                        setFormData(prev => ({ ...prev, category_id: category.id }));
                    } else {
                        // Default fallback ids
                        const defaultCat = allCategories.find(c => c.id === catId);
                        if (defaultCat) setFormData(prev => ({ ...prev, category_id: defaultCat.id }));
                    }
                }
                break;
            }
        }
    }, [formData.name, allCategories]);

    const selectedPayment = formData.payment_type === 'card'
        ? cards.find(c => c.id === formData.payment_id)
        : accounts.find(a => a.id === formData.payment_id);

    const selectedCategory = allCategories.find(c => c.id === formData.category_id);

    const isStep1Valid = formData.name && formData.amount && formData.billing_date;
    const isStep2Valid = formData.payment_id;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.name || !formData.amount || !formData.payment_id) return;

        createSub.mutate({
            name: formData.name,
            amount: parseCurrency(formData.amount),
            billing_date: Number(formData.billing_date),
            frequency: formData.frequency,
            category_id: formData.category_id || undefined,
            card_id: formData.payment_type === 'card' ? formData.payment_id : undefined,
            bank_account_id: formData.payment_type === 'account' ? formData.payment_id : undefined,
            status: 'active'
        }, {
            onSuccess: () => navigate("/subscriptions")
        });
    };

    const nextStep = () => {
        if (currentStep === STEPS.BASIC_INFO && isStep1Valid) setCurrentStep(STEPS.PAYMENT);
        else if (currentStep === STEPS.PAYMENT && isStep2Valid) setCurrentStep(STEPS.REVIEW);
    };

    const prevStep = () => {
        if (currentStep === STEPS.PAYMENT) setCurrentStep(STEPS.BASIC_INFO);
        else if (currentStep === STEPS.REVIEW) setCurrentStep(STEPS.PAYMENT);
        else navigate("/subscriptions");
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-32">
                {/* Header Premium */}
                <header className="px-5 pt-safe-top bg-background/80 backdrop-blur-xl sticky top-0 z-30 border-b border-border/50">
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={prevStep}
                                className="rounded-full hover:bg-muted"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="font-serif text-lg font-bold">Assinatura</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                                    Passo {currentStep} de 3
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-300",
                                        currentStep === s ? "w-6 bg-primary" : "w-1.5 bg-muted"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                <main className="px-6 pt-8 max-w-lg mx-auto">
                    <AnimatePresence mode="wait">
                        {currentStep === STEPS.BASIC_INFO && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-serif font-bold tracking-tight">O que vamos assinar hoje?</h2>
                                    <p className="text-sm text-muted-foreground">Preencha os detalhes básicos do serviço.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-center">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-24 h-24 rounded-[2rem] bg-card border-2 border-dashed border-muted flex items-center justify-center relative overflow-hidden ring-offset-background transition-all group-hover:border-primary/50">
                                                {formData.name ? (
                                                    <div className="p-4">
                                                        <BankLogo bankName={formData.name} className="w-16 h-16 scale-125" />
                                                    </div>
                                                ) : (
                                                    <Sparkles className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Serviço</Label>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Netflix, Spotify, Academia..."
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="h-16 rounded-2xl bg-card border-muted-foreground/10 text-lg px-12 focus:ring-primary/20"
                                                />
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Valor</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="0,00"
                                                        value={formData.amount}
                                                        onChange={(e) => {
                                                            vibrate();
                                                            setFormData({ ...formData, amount: formatCurrencyInput(e.target.value) });
                                                        }}
                                                        className="h-16 rounded-2xl bg-card border-muted-foreground/10 text-lg px-12"
                                                    />
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Vencimento</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        value={formData.billing_date}
                                                        onChange={(e) => {
                                                            vibrate();
                                                            setFormData({ ...formData, billing_date: Number(e.target.value) });
                                                        }}
                                                        className="h-16 rounded-2xl bg-card border-muted-foreground/10 text-lg px-12 text-center"
                                                    />
                                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                                </div>
                                            </div>
                                        </div>

                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria</Label>

                                        {selectedCategory ? (
                                            <div className="flex items-center gap-2 p-3 bg-card border border-primary/20 rounded-xl shadow-sm">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <selectedCategory.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{selectedCategory.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Selecionada automaticamente</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-8"
                                                    onClick={() => setFormData({ ...formData, category_id: "" })}
                                                >
                                                    Alterar
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    className="w-full h-12 pl-4 pr-10 rounded-xl bg-card border-border appearance-none text-sm font-medium focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={formData.category_id}
                                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                >
                                                    <option value="">Selecionar categoria...</option>
                                                    {allCategories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === STEPS.PAYMENT && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-serif font-bold tracking-tight">Qual a origem do pagamento?</h2>
                                    <p className="text-sm text-muted-foreground">Escolha o cartão ou conta bancária.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex p-1 bg-muted/30 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, payment_type: 'card', payment_id: "" })}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all",
                                                formData.payment_type === 'card' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Cartão
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, payment_type: 'account', payment_id: "" })}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all",
                                                formData.payment_type === 'account' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            <Landmark className="w-4 h-4" />
                                            Conta
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.payment_type === 'card' ? (
                                            cards.length === 0 ? (
                                                <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                                                    <CreditCard className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                                                    <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado</p>
                                                    <Button variant="link" className="mt-2 text-primary" onClick={() => navigate("/cards/add")}>
                                                        Adicionar Cartão
                                                    </Button>
                                                </div>
                                            ) : (
                                                cards.map((card) => (
                                                    <motion.div
                                                        key={card.id}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setFormData({ ...formData, payment_id: card.id })}
                                                        className={cn(
                                                            "p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative overflow-hidden",
                                                            formData.payment_id === card.id
                                                                ? "border-primary bg-primary/5 shadow-md"
                                                                : "border-muted bg-card hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                                            formData.payment_id === card.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            <CreditCard className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold">{card.card_name}</p>
                                                            <p className="text-xs text-muted-foreground">Final {card.last_four_digits} · Vence dia {card.due_day}</p>
                                                        </div>
                                                        {formData.payment_id === card.id && (
                                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))
                                            )
                                        ) : (
                                            accounts.length === 0 ? (
                                                <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                                                    <Landmark className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                                                    <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
                                                    <Button variant="link" className="mt-2 text-primary" onClick={() => navigate("/banks")}>
                                                        Adicionar Conta
                                                    </Button>
                                                </div>
                                            ) : (
                                                accounts.map((acc) => (
                                                    <motion.div
                                                        key={acc.id}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setFormData({ ...formData, payment_id: acc.id })}
                                                        className={cn(
                                                            "p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-4 relative overflow-hidden",
                                                            formData.payment_id === acc.id
                                                                ? "border-primary bg-primary/5 shadow-md"
                                                                : "border-muted bg-card hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                                            formData.payment_id === acc.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            <Landmark className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold">{acc.bank_name}</p>
                                                            <p className="text-xs text-muted-foreground">{acc.account_type === 'checking' ? 'Conta Corrente' : 'Poupança'}</p>
                                                        </div>
                                                        {formData.payment_id === acc.id && (
                                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))
                                            )
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === STEPS.REVIEW && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <div className="inline-flex p-3 rounded-full bg-essential/10 text-essential mb-2">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold tracking-tight">Tudo pronto!</h2>
                                    <p className="text-sm text-muted-foreground px-8">Revise os detalhes antes de confirmar sua nova assinatura.</p>
                                </div>

                                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl bg-card">
                                    <div className="bg-primary/5 p-6 flex flex-col items-center border-b border-primary/10">
                                        <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-4 ring-4 ring-primary/5">
                                            <BankLogo bankName={formData.name} className="w-14 h-14" />
                                        </div>
                                        <h3 className="text-xl font-bold">{formData.name}</h3>
                                        <p className="text-primary font-serif text-2xl font-bold mt-1">
                                            {formatCurrency(parseCurrency(formData.amount))}
                                            <span className="text-xs font-sans text-muted-foreground ml-1">/mês</span>
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span className="text-sm">Vencimento</span>
                                            </div>
                                            <span className="font-bold">Todo dia {formData.billing_date}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CreditCard className="w-4 h-4" />
                                                <span className="text-sm">Pagamento</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">
                                                    {(selectedPayment as any)?.card_name || (selectedPayment as any)?.bank_name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formData.payment_type === 'card' ? 'Cartão de Crédito' : 'Débito em Conta'}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedCategory && (
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Tag className="w-4 h-4" />
                                                    <span className="text-sm">Categoria</span>
                                                </div>
                                                <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold">
                                                    {selectedCategory.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <div className="p-4 bg-muted/30 rounded-2xl flex gap-3 items-start">
                                    <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Lançaremos este gasto automaticamente na sua conta todo dia {formData.billing_date},
                                        mantendo seu saldo sempre atualizado sem que você precise fazer nada.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Footer Fixo */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-40">
                    <div className="max-w-lg mx-auto flex gap-3">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-16 w-20 rounded-2xl border-2"
                                onClick={prevStep}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        )}

                        <Button
                            size="lg"
                            className={cn(
                                "h-16 rounded-2xl text-lg font-bold shadow-large transition-all flex-1",
                                currentStep === STEPS.REVIEW ? "gradient-warm" : "gradient-primary"
                            )}
                            disabled={
                                (currentStep === STEPS.BASIC_INFO && !isStep1Valid) ||
                                (currentStep === STEPS.PAYMENT && !isStep2Valid) ||
                                createSub.isPending
                            }
                            onClick={currentStep === STEPS.REVIEW ? () => handleSubmit() : nextStep}
                        >
                            {createSub.isPending ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : currentStep === STEPS.REVIEW ? (
                                "Confirmar Assinatura"
                            ) : (
                                <span className="flex items-center gap-2">
                                    Próximo Passo
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </PageTransition >
    );
}

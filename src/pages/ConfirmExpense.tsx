import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, Check, Utensils, Car, Gamepad2, Home, CreditCard, 
  MoreHorizontal, RefreshCw, Calendar, Users, User, ChevronDown,
  Banknote, Smartphone, CreditCard as CreditCardIcon, Loader2, QrCode,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useCreateCreditCardPurchase, useCreditCards } from "@/hooks/useCreditCards";
import { useCreateReceivable } from "@/hooks/useReceivables";
import { useBankAccounts, useUpdateBankBalance } from "@/hooks/useBankAccounts";
import { useCashAccount } from "@/hooks/useCashAccount";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  defaultCategories, 
  categoryGroups, 
  getGroupedCategories,
  type CategoryConfig,
  type CategoryGroup 
} from "@/lib/categories";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

type Step = "expense" | "recurring" | "reimbursement" | "confirm";
type PaymentMethod = "cash" | "debit" | "credit" | "pix";
type EmotionType = "pilar" | "essencial" | "impulso";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}

// Categorias rápidas para exibir na tela inicial (6 mais usadas)
const quickCategories = [
  "alimentacao",
  "transporte_publico",
  "lazer",
  "mercado",
  "delivery",
  "outros",
];

const paymentOptions: PaymentOption[] = [
  { value: "pix", label: "PIX", icon: <QrCode className="w-5 h-5" /> },
  { value: "cash", label: "Dinheiro", icon: <Banknote className="w-5 h-5" /> },
  { value: "debit", label: "Débito", icon: <Smartphone className="w-5 h-5" /> },
  { value: "credit", label: "Crédito", icon: <CreditCardIcon className="w-5 h-5" /> },
];

const emotionIcons: Record<EmotionType, React.ElementType> = {
  pilar: Home,
  essencial: Check,
  impulso: CreditCard,
};

const emotionOptions = [
  { value: "pilar" as EmotionType, label: "Pilar", description: "Essencial para viver" },
  { value: "essencial" as EmotionType, label: "Essencial", description: "Necessário" },
  { value: "impulso" as EmotionType, label: "Impulso", description: "Compra por impulso" },
];

const confirmationIcons = {
  yes: Check,
  no: MoreHorizontal,
};

const confirmationOptions = [
  { value: true, label: "Sim", iconKey: "yes" as const },
  { value: false, label: "Não", iconKey: "no" as const },
];

export const ConfirmExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const createExpense = useCreateExpense();
  const createCreditCardPurchase = useCreateCreditCardPurchase();
  const { data: creditCards = [] } = useCreditCards();
  const { data: bankAccounts = [] } = useBankAccounts();
  const updateBankBalance = useUpdateBankBalance();
  const createReceivable = useCreateReceivable();
  const { ensureCashAccount, cashAccountId, isCreating: isCreatingCash } = useCashAccount();
  
  const amount = location.state?.amount || 67.50;
  const isNew = id === "new";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const [step, setStep] = useState<Step>("expense");
  
  // Layer 1 - Basic expense info
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>();
  
  // Layer 2 - Time behavior
  const [isRecurring, setIsRecurring] = useState<boolean | undefined>();
  const [installments, setInstallments] = useState<string>("");
  
  // Layer 3 - Reimbursement
  const [isForOtherPerson, setIsForOtherPerson] = useState<boolean | undefined>();
  const [reimbursementPersonName, setReimbursementPersonName] = useState("");
  
  // Confirmation
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | undefined>();
  const [wouldDoAgain, setWouldDoAgain] = useState<boolean | undefined>();

  // Filtered categories for search
  const filteredCategories = categorySearch.trim()
    ? defaultCategories.filter(c => 
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : defaultCategories;

  // Get selected category object
  const selectedCategory = category 
    ? defaultCategories.find(c => c.id === category) 
    : undefined;

  // Quick categories to show
  const quickCategoryObjects = quickCategories
    .map(id => defaultCategories.find(c => c.id === id))
    .filter((c): c is CategoryConfig => c !== undefined);

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const handleBack = () => {
    if (step === "confirm") {
      setStep("reimbursement");
    } else if (step === "reimbursement") {
      setStep("recurring");
    } else if (step === "recurring") {
      setStep("expense");
    } else {
      navigate(-1);
    }
  };

  const canContinueExpense = () => {
    if (!description.trim() || !category || !paymentMethod) return false;
    if (paymentMethod === "credit" && !selectedCardId) return false;
    if (paymentMethod === "cash") return true; // Cash account will be auto-created
    if (paymentMethod !== "credit" && bankAccounts.length > 0 && !selectedBankId) return false;
    return true;
  };

  const canContinueRecurring = () => {
    if (paymentMethod === "credit") {
      // For credit card, installments default to 1 (à vista) if empty
      return true;
    }
    if (isRecurring === undefined) return false;
    if (isRecurring === true && (!installments || parseInt(installments) < 1)) return false;
    return true;
  };

  const canContinueReimbursement = () => {
    if (isForOtherPerson === undefined) return false;
    if (isForOtherPerson && !reimbursementPersonName.trim()) return false;
    return true;
  };

  const handleComplete = async () => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const isCreditCard = paymentMethod === "credit" && selectedCardId;

      if (isCreditCard) {
        // CARTÃO DE CRÉDITO: Criar compra + parcelas (NÃO criar gasto)
        const totalInstallments = isRecurring && installments ? parseInt(installments) : 1;
        await createCreditCardPurchase.mutateAsync({
          card_id: selectedCardId,
          description: description || selectedCategory?.name || "Compra no cartão",
          total_amount: amount,
          total_installments: totalInstallments,
          // category_id omitido: categorias locais não são UUIDs válidos para FK
          purchase_date: new Date().toISOString().split("T")[0],
        });
      } else {
        // For cash payments, ensure the cash account exists
        let bankId = selectedBankId;
        if (paymentMethod === "cash") {
          bankId = await ensureCashAccount();
        }

        // GASTO NORMAL: Criar expense
        await createExpense.mutateAsync({
          amount,
          description: description || selectedCategory?.name || "Gasto registrado",
          emotion: selectedEmotion,
          status: "confirmed",
          source: "manual",
          is_installment: isRecurring || false,
          total_installments: isRecurring && installments ? parseInt(installments) : undefined,
          installment_number: 1,
          bank_account_id: bankId || undefined,
        } as any);

        // Update bank balance if a bank was selected
        if (bankId) {
          await updateBankBalance.mutateAsync({
            accountId: bankId,
            delta: -amount,
          });
        }
      }

      // Se há reembolso, criar receivable em ambos os casos
      if (isForOtherPerson && reimbursementPersonName) {
        const today = new Date();
        const dueDate = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split("T")[0];

        await createReceivable.mutateAsync({
          debtor_name: reimbursementPersonName.trim(),
          amount,
          description: `Reembolso de gasto - ${description || 'Gasto'}`,
          due_date: dueDate,
          status: "pending",
        });
      }

      toast.success(isCreditCard ? "Compra registrada no cartão!" : "Gasto confirmado com sucesso!");
      navigate("/", { state: { success: true } });
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case "expense": return 1;
      case "recurring": return 2;
      case "reimbursement": return 3;
      case "confirm": return 4;
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Passo {getStepNumber()} de {totalSteps}
            </p>
            <h1 className="font-serif text-xl font-semibold">Novo Gasto</h1>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="px-5 py-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                getStepNumber() >= s ? "gradient-warm" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col px-5 py-6 overflow-y-auto">
        {/* Amount Display */}
        <FadeIn className="text-center mb-6">
          <p className="text-muted-foreground mb-1">Valor do gasto</p>
          <p className="font-serif text-4xl font-semibold">{formattedAmount}</p>
          {!isNew && (
            <p className="text-sm text-muted-foreground mt-2">
              Mercado Central · Importado do banco
            </p>
          )}
        </FadeIn>

        {/* LAYER 1 - Basic Expense Info */}
        {step === "expense" && (
          <FadeIn key="expense" className="flex-1 flex flex-col">
            <h2 className="text-center text-xl font-medium mb-6">
              Detalhes do gasto
            </h2>

            {/* Description input */}
            <div className="mb-5">
              <label className="text-sm text-muted-foreground mb-2 block">
                Onde foi esse gasto?
              </label>
              <Input
                placeholder="Ex: Restaurante, Supermercado, Uber..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={50}
                className="text-base"
              />
            </div>

            {/* Category selector */}
            <div className="mb-5">
              <label className="text-sm text-muted-foreground mb-3 block">
                Categoria
              </label>
              
              {/* Quick Categories Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickCategoryObjects.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        category === cat.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-secondary"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", category === cat.id ? "text-primary" : cat.color)} />
                      <span className="text-xs font-medium truncate w-full text-center">{cat.name}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {/* See All Categories Button */}
              <Sheet open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    size="sm"
                  >
                    {selectedCategory && !quickCategories.includes(selectedCategory.id) ? (
                      <div className="flex items-center gap-2">
                        <selectedCategory.icon className={cn("w-4 h-4", selectedCategory.color)} />
                        <span>{selectedCategory.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Ver todas as categorias</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Escolher Categoria</SheetTitle>
                  </SheetHeader>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar categoria..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <ScrollArea className="h-[calc(80vh-140px)]">
                    <div className="space-y-4 pr-4">
                      {Object.entries(categoryGroups).map(([groupKey, groupInfo]) => {
                        const groupCategories = filteredCategories.filter(
                          c => c.group === groupKey
                        );
                        
                        if (groupCategories.length === 0) return null;
                        
                        const GroupIcon = groupInfo.icon;
                        
                        return (
                          <div key={groupKey}>
                            <div className="flex items-center gap-2 mb-2">
                              <GroupIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {groupInfo.name}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {groupCategories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                  <motion.button
                                    key={cat.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setCategory(cat.id);
                                      setCategorySheetOpen(false);
                                      setCategorySearch("");
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                      category === cat.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-card hover:bg-secondary"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center",
                                      category === cat.id ? "bg-primary/20" : "bg-muted/50"
                                    )}>
                                      <Icon className={cn(
                                        "w-4 h-4",
                                        category === cat.id ? "text-primary" : cat.color
                                      )} />
                                    </div>
                                    <span className="text-sm font-medium truncate">
                                      {cat.name}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* Payment Method selector */}
            <div className="mb-5">
              <label className="text-sm text-muted-foreground mb-3 block">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-4 gap-2">
                {paymentOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPaymentMethod(opt.value);
                      if (opt.value !== "credit") setSelectedCardId(undefined);
                      if (opt.value === "cash" && cashAccountId) {
                        setSelectedBankId(cashAccountId);
                      } else if (opt.value === "cash" && !cashAccountId) {
                        setSelectedBankId("__cash_pending__");
                      } else if (opt.value !== "cash" && (selectedBankId === "__cash_pending__" || selectedBankId === cashAccountId)) {
                        setSelectedBankId(undefined);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      paymentMethod === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-secondary"
                    )}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cash account indicator */}
            {paymentMethod === "cash" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5"
              >
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/10">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Dinheiro em mãos</p>
                    <p className="text-xs text-muted-foreground">Conta criada automaticamente</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Credit Card Selector (only when credit is selected) */}
            {paymentMethod === "credit" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5"
              >
                <label className="text-sm text-muted-foreground mb-3 block">
                  Qual cartão? *
                </label>
                {creditCards.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground mb-2">Nenhum cartão cadastrado</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/cards/add")}
                    >
                      Cadastrar cartão
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {creditCards.map((card) => (
                      <motion.button
                        key={card.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCardId(card.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                          selectedCardId === card.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-secondary"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: card.color + "30" }}
                        >
                          <CreditCardIcon className="w-4 h-4" style={{ color: card.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.card_name}</p>
                          {card.last_four_digits && (
                            <p className="text-xs text-muted-foreground">
                              •••• {card.last_four_digits}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Bank Account Selector (for non-credit, non-cash payments) */}
            {paymentMethod && paymentMethod !== "credit" && paymentMethod !== "cash" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5"
              >
                <label className="text-sm text-muted-foreground mb-3 block">
                  Conta de origem *
                </label>
                <div className="space-y-2">
                  {bankAccounts.map((account) => (
                    <motion.button
                      key={account.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedBankId(selectedBankId === account.id ? undefined : account.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        selectedBankId === account.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-secondary"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.bank_name}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </FadeIn>
        )}

        {/* LAYER 2 - Time Behavior */}
        {step === "recurring" && (
          <FadeIn key="recurring" className="flex-1 flex flex-col">
            <h2 className="text-center text-xl font-medium mb-2">
              {paymentMethod === "credit" ? "Quantas parcelas?" : "Esse gasto se repete?"}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-8">
              {paymentMethod === "credit" 
                ? "Informe o número de parcelas da compra" 
                : "Ex: academia, streaming, financiamento"}
            </p>

            {/* For credit card: just show installments input directly */}
            {paymentMethod === "credit" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-sm text-muted-foreground mb-3 block text-center">
                  Número de parcelas
                </label>
                <div className="flex justify-center">
                  <div className="w-32">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex: 3"
                      min={1}
                      max={48}
                      value={installments}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= 48)) {
                          setInstallments(val);
                        }
                      }}
                      className="h-12 text-base text-center"
                      autoFocus
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {installments && parseInt(installments) > 0
                    ? `${installments}x de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / parseInt(installments))}`
                    : "1x (à vista)"}
                </p>
              </motion.div>
            ) : (
              <>
                {/* Yes/No Options for recurring */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRecurring(true)}
                    className={cn(
                      "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                      isRecurring === true
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isRecurring === true ? "bg-primary/20" : "bg-muted"
                    )}>
                      <RefreshCw className={cn(
                        "w-6 h-6",
                        isRecurring === true ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Sim</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gasto recorrente
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRecurring(false)}
                    className={cn(
                      "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                      isRecurring === false
                        ? "border-muted-foreground bg-secondary"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isRecurring === false ? "bg-muted-foreground/20" : "bg-muted"
                    )}>
                      <Calendar className={cn(
                        "w-6 h-6",
                        isRecurring === false ? "text-muted-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Não</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gasto único
                      </p>
                    </div>
                  </motion.button>
                </div>

                {/* Installments (only if recurring) */}
                {isRecurring === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <label className="text-sm text-muted-foreground mb-3 block text-center">
                      Por quantos meses esse gasto se repete?
                    </label>
                    <div className="flex justify-center">
                      <div className="w-32">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="Ex: 12"
                          min={1}
                          max={120}
                          value={installments}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= 120)) {
                              setInstallments(val);
                            }
                          }}
                          className="h-12 text-base text-center"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </FadeIn>
        )}

        {/* LAYER 3 - Reimbursement */}
        {step === "reimbursement" && (
          <FadeIn key="reimbursement" className="flex-1 flex flex-col">
            <h2 className="text-center text-xl font-medium mb-2">
              Foi para outra pessoa?
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-8">
              Alguém vai te reembolsar por esse gasto?
            </p>

            {/* Yes/No Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsForOtherPerson(true)}
                className={cn(
                  "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                  isForOtherPerson === true
                    ? "border-essential bg-essential/10"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isForOtherPerson === true ? "bg-essential/20" : "bg-muted"
                )}>
                  <Users className={cn(
                    "w-6 h-6",
                    isForOtherPerson === true ? "text-essential" : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Sim</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vou ser reembolsado
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsForOtherPerson(false)}
                className={cn(
                  "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                  isForOtherPerson === false
                    ? "border-muted-foreground bg-secondary"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isForOtherPerson === false ? "bg-muted-foreground/20" : "bg-muted"
                )}>
                  <User className={cn(
                    "w-6 h-6",
                    isForOtherPerson === false ? "text-muted-foreground" : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Não</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gasto meu
                  </p>
                </div>
              </motion.button>
            </div>

            {/* Person Name Input */}
            {isForOtherPerson === true && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <label className="text-sm text-muted-foreground mb-3 block text-center">
                  Quem vai te reembolsar?
                </label>
                <Input
                  placeholder="Nome da pessoa"
                  value={reimbursementPersonName}
                  onChange={(e) => setReimbursementPersonName(e.target.value)}
                  maxLength={30}
                  className="text-base text-center"
                />
              </motion.div>
            )}
          </FadeIn>
        )}

        {/* LAYER 4 - Confirmation */}
        {step === "confirm" && (
          <FadeIn key="confirm" className="flex-1 flex flex-col">
            <h2 className="text-center text-xl font-medium mb-2">
              Como você se sente sobre esse gasto?
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-8">
              Isso ajuda a entender seu comportamento financeiro
            </p>

            {/* Emotion Selector */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-3 block">
                Tipo de gasto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {emotionOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedEmotion(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      selectedEmotion === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-secondary"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-1",
                      selectedEmotion === opt.value ? "bg-white/20" : "bg-muted"
                    )}>
                      {(() => { const Icon = emotionIcons[opt.value]; return <Icon className="w-5 h-5" />; })()}
                    </div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Would Do Again */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-3 block">
                Faria de novo?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {confirmationOptions.map((opt) => (
                  <motion.button
                    key={String(opt.value)}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setWouldDoAgain(opt.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      wouldDoAgain === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-secondary"
                    )}
                  >
                    {(() => { const Icon = confirmationIcons[opt.iconKey]; return <Icon className="w-5 h-5" />; })()}
                    <span className="font-medium">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Footer Button */}
      <div className="px-5 pb-safe-bottom">
        <div className="pb-4">
          {step === "expense" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-base"
                onClick={() => navigate("/")}
              >
                Cancelar
              </Button>
              <Button
                variant="warm"
                size="lg"
                className="flex-1 h-14 text-base"
                onClick={() => setStep("recurring")}
                disabled={!canContinueExpense()}
              >
                Continuar
              </Button>
            </div>
          )}
          {step === "recurring" && (
            <Button
              variant="warm"
              size="lg"
              className="w-full h-14 text-base"
              onClick={() => setStep("reimbursement")}
              disabled={!canContinueRecurring()}
            >
              Continuar
            </Button>
          )}
          {step === "reimbursement" && (
            <Button
              variant="warm"
              size="lg"
              className="w-full h-14 text-base"
              onClick={() => setStep("confirm")}
              disabled={!canContinueReimbursement()}
            >
              Continuar
            </Button>
          )}
          {step === "confirm" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-base"
                onClick={() => navigate("/")}
              >
                Cancelar
              </Button>
              <Button
                variant="warm"
                size="lg"
                className="flex-1 h-14 text-base gap-2"
                onClick={handleComplete}
                disabled={!selectedEmotion || wouldDoAgain === undefined || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Confirmar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmExpense;

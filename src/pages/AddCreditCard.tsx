import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, CreditCard as CreditCardIcon, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCreditCard, useCreditCards } from "@/hooks/useCreditCards";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";
import { Switch } from "@/components/ui/switch";
import { BANK_LIST, BRAND_LIST, detectBank } from "@/lib/cardBranding";
import { BankLogo } from "@/components/BankLogo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function AddCreditCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromOnboarding = (location.state as any)?.fromOnboarding === true;
  const createCard = useCreateCreditCard();

  const [cardName, setCardName] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isMainCard, setIsMainCard] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: profile } = useProfile();
  const { data: cards = [] } = useCreditCards();
  const updateProfile = useUpdateProfile();

  // Find existing main card names for the confirmation message
  const existingCardId = (profile as any)?.wa_default_expense_card_id;
  const existingCard = cards.find(c => c.id === existingCardId);

  const bankTheme = selectedBank
    ? BANK_LIST.find(b => b.key === selectedBank)
    : detectBank(cardName);

  const cardColor = bankTheme?.color || "#8B5CF6";

  const canSubmit = cardName.trim() && closingDay && dueDay;

  const handleBankSelect = (bankKey: string) => {
    setSelectedBank(bankKey);
    const bank = BANK_LIST.find(b => b.key === bankKey);
    if (bank && !cardName) {
      setCardName(bank.name);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const newCard = await createCard.mutateAsync({
      card_name: cardName.trim(),
      card_brand: cardBrand.trim() || null,
      last_four_digits: lastFour.trim() || null,
      credit_limit: parseCurrency(limit),
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      color: cardColor,
    });

    if (isMainCard && newCard?.id) {
      await updateProfile.mutateAsync({
        wa_default_expense_card_id: newCard.id
      });
    }

    if (fromOnboarding && newCard?.id) {
      // Go directly to import with the new card pre-selected
      navigate("/cards/import", { replace: true, state: { fromOnboarding: true, preselectedCardId: newCard.id } });
    } else if (fromOnboarding) {
      navigate("/cards/import", { replace: true, state: { fromOnboarding: true } });
    } else {
      navigate("/");
    }
  };

  const handleCancel = () => {
    if (fromOnboarding) {
      // User doesn't want to add a card - go home
      navigate("/");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Novo Cartão</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
        <FadeIn>
          {/* Card Preview */}
          <div
            className="rounded-2xl p-5 text-white mb-6 shadow-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${cardColor}, ${cardColor}cc)` }}
          >
            <div className="absolute top-4 right-4 opacity-20">
              <CreditCardIcon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner overflow-hidden border border-white/10 backdrop-blur-sm">
                <BankLogo
                  bankName={bankTheme?.name || "Cartão"}
                  className="w-full h-full border-0 bg-transparent"
                  iconClassName="text-white"
                />
              </div>
              <p className="text-sm opacity-80 font-semibold tracking-tight uppercase">
                {cardBrand || bankTheme?.name || "Cartão"}
              </p>

              <h3 className="text-xl font-bold mt-1">{cardName || "Nome do cartão"}</h3>
              {lastFour && (
                <p className="text-sm opacity-70 font-mono mt-3">•••• •••• •••• {lastFour}</p>
              )}
              <div className="mt-4 flex justify-between text-sm">
                <div>
                  <p className="text-xs opacity-60">Limite</p>
                  <p className="font-semibold">{limit ? `R$ ${limit}` : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-60">Vencimento</p>
                  <p className="font-medium">{dueDay ? `Dia ${dueDay}` : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Selector */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Banco emissor</label>
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {BANK_LIST.filter(b => b.key !== "outros").map(bank => (
                <button
                  key={bank.key}
                  onClick={() => handleBankSelect(bank.key)}
                  className="flex flex-col items-center gap-2 min-w-[64px] snap-center group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-sm",
                    selectedBank === bank.key
                      ? "border-primary ring-2 ring-primary/20 ring-offset-2 scale-110"
                      : "border-border bg-card group-hover:border-primary/50"
                  )}
                    style={{ backgroundColor: selectedBank === bank.key ? bank.color : "#ffffff" }}
                  >
                    {selectedBank === bank.key ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <BankLogo bankName={bank.name} color={bank.color} size="lg" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center truncate w-full transition-colors",
                    selectedBank === bank.key ? "text-primary" : "text-muted-foreground"
                  )}>
                    {bank.name}
                  </span>
                </button>
              ))}

              <button
                onClick={() => handleBankSelect("outros")}
                className="flex flex-col items-center gap-2 min-w-[64px] snap-center group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 shadow-sm bg-muted",
                  selectedBank === "outros"
                    ? "border-primary ring-2 ring-primary/20 ring-offset-2 scale-110"
                    : "border-border group-hover:border-primary/50"
                )}>
                  {selectedBank === "outros" ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">...</span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center truncate w-full transition-colors",
                  selectedBank === "outros" ? "text-primary" : "text-muted-foreground"
                )}>
                  Outro
                </span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Nome do cartão *</label>
            <Input
              placeholder="Ex: Nubank – Compras, Itaú – Viagens"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              maxLength={30}
            />
          </div>

          {/* Brand - Horizontal Scroll */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Bandeira</label>
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {BRAND_LIST.map(brand => (
                <button
                  key={brand.key}
                  onClick={() => setCardBrand(brand.name)}
                  className="flex flex-col items-center gap-2 min-w-[64px] snap-center group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 shadow-sm font-bold text-white",
                    cardBrand === brand.name
                      ? "ring-2 ring-primary/20 ring-offset-2 scale-110"
                      : "border-border bg-card group-hover:border-primary/50"
                  )}
                    style={{ backgroundColor: brand.color }}
                  >
                    {cardBrand === brand.name ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs">{brand.abbr}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center truncate w-full transition-colors",
                    cardBrand === brand.name ? "text-primary" : "text-muted-foreground"
                  )}>
                    {brand.name}
                  </span>
                </button>
              ))}

              {/* Other Brand */}
              <button
                onClick={() => setCardBrand("Outra")}
                className="flex flex-col items-center gap-2 min-w-[64px] snap-center group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 shadow-sm font-bold bg-muted",
                  cardBrand === "Outra"
                    ? "ring-2 ring-primary/20 ring-offset-2 scale-110 border-primary"
                    : "border-border group-hover:border-primary/50"
                )}>
                  {cardBrand === "Outra" ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <span className="text-xs text-muted-foreground">...</span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center truncate w-full transition-colors",
                  cardBrand === "Outra" ? "text-primary" : "text-muted-foreground"
                )}>
                  Outra
                </span>
              </button>
            </div>
          </div>

          {/* Last 4 digits */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Últimos 4 dígitos</label>
            <Input
              placeholder="1234"
              value={lastFour}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setLastFour(v);
              }}
              maxLength={4}
              inputMode="numeric"
            />
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Limite total</label>
            <Input
              placeholder="5.000,00"
              value={limit}
              onChange={e => {
                const digits = e.target.value.replace(/[^\d]/g, "");
                setLimit(digits ? formatCurrencyInput(digits) : "");
              }}
              inputMode="numeric"
            />
          </div>

          {/* Closing & Due days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Dia de fechamento *</label>
              <Input
                placeholder="Ex: 15"
                value={closingDay}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (!v || (parseInt(v) >= 1 && parseInt(v) <= 31)) setClosingDay(v);
                }}
                inputMode="numeric"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Dia de vencimento *</label>
              <Input
                placeholder="Ex: 25"
                value={dueDay}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (!v || (parseInt(v) >= 1 && parseInt(v) <= 31)) setDueDay(v);
                }}
                inputMode="numeric"
                maxLength={2}
              />
            </div>
          </div>

          {/* Main card toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-soft">
            <div>
              <p className="text-sm font-medium">Definir como cartão principal</p>
              <p className="text-xs text-muted-foreground">Usar para gastos automáticos via WhatsApp</p>
            </div>
            <Switch
              checked={isMainCard}
              onCheckedChange={(checked) => {
                if (checked && existingCardId) {
                  setShowConfirm(true);
                } else {
                  setIsMainCard(checked);
                }
              }}
            />
          </div>
        </FadeIn>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Substituir cartão principal?</AlertDialogTitle>
              <AlertDialogDescription>
                O cartão <strong>{existingCard?.card_name}</strong> já está definido como principal.
                Deseja que este novo cartão passe a ser o padrão para o WhatsApp?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsMainCard(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setIsMainCard(true);
                setShowConfirm(false);
              }}>
                Sim, substituir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      {/* Footer */}
      <div className="px-5 pb-safe-bottom">
        <div className="pb-4 flex gap-3">
          <Button variant="outline" size="lg" className="flex-1 h-14" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="warm"
            size="lg"
            className="flex-1 h-14 gap-2"
            onClick={handleSubmit}
            disabled={!canSubmit || createCard.isPending}
          >
            {createCard.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

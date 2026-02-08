import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, CreditCard as CreditCardIcon, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCreditCard } from "@/hooks/useCreditCards";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";
import { BANK_LIST, BRAND_LIST, detectBank } from "@/lib/cardBranding";

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
    await createCard.mutateAsync({
      card_name: cardName.trim(),
      card_brand: cardBrand.trim() || null,
      last_four_digits: lastFour.trim() || null,
      credit_limit: parseCurrency(limit),
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      color: cardColor,
    });
    if (fromOnboarding) {
      navigate("/cards/import", { replace: true });
    } else {
      navigate("/cards");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {(bankTheme?.name || "C").charAt(0)}
                  </span>
                </div>
                <p className="text-sm opacity-80">{cardBrand || bankTheme?.name || "Cartão"}</p>
              </div>
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
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Banco emissor</label>
            <div className="flex gap-2 flex-wrap">
              {BANK_LIST.filter(b => b.key !== "outros").slice(0, 12).map(bank => (
                <button
                  key={bank.key}
                  onClick={() => handleBankSelect(bank.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    selectedBank === bank.key
                      ? "border-foreground bg-foreground text-background scale-105"
                      : "border-border bg-card text-foreground hover:border-foreground/30"
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: bank.color }}
                  />
                  {bank.name}
                </button>
              ))}
              <button
                onClick={() => handleBankSelect("outros")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  selectedBank === "outros"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground/30"
                )}
              >
                Outro
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

          {/* Brand */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Bandeira</label>
            <div className="flex gap-2 flex-wrap">
              {BRAND_LIST.map(brand => (
                <button
                  key={brand.key}
                  onClick={() => setCardBrand(brand.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    cardBrand === brand.name
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/30"
                  )}
                >
                  {brand.name}
                </button>
              ))}
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
        </FadeIn>
      </main>

      {/* Footer */}
      <div className="px-5 pb-safe-bottom">
        <div className="pb-4 flex gap-3">
          <Button variant="outline" size="lg" className="flex-1 h-14" onClick={() => navigate(-1)}>
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

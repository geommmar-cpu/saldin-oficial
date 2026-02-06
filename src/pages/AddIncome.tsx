import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { AmountDisplay } from "@/components/ui/amount-display";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { parseCurrency } from "@/lib/currency";

export const AddIncome = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const [amount, setAmount] = useState("");

  const handleContinue = () => {
    const numericAmount = parseCurrency(amount);
    if (numericAmount <= 0) return;
    navigate("/income/confirm", { state: { amount: numericAmount } });
  };

  const openWhatsApp = () => {
    const whatsappUrl = "https://wa.me/5511999999999";
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Nova Receita</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5">
        {/* Amount Display */}
        <FadeIn className="flex-1 flex flex-col items-center justify-center">
          <AmountDisplay amount={amount} label="Valor da receita" />
          <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
            Registre rápido aqui, ou envie por texto/foto para {preferences.aiName} no WhatsApp.
          </p>
        </FadeIn>

        {/* WhatsApp Alternative */}
        <FadeIn delay={0.1} className="mb-6">
          <div className="flex justify-center">
            <Button 
              variant="soft" 
              size="sm" 
              className="gap-2"
              onClick={openWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              Enviar via WhatsApp
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Texto, foto ou áudio — {preferences.aiName} extrai tudo automaticamente
          </p>
        </FadeIn>

        {/* Keypad */}
        <FadeIn delay={0.2} className="pb-6">
          <NumericKeypad value={amount} onChange={setAmount} />
        </FadeIn>

        {/* Continue Button */}
        <FadeIn delay={0.3} className="pb-4 space-y-2">
          <Button
            variant="warm"
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={parseCurrency(amount) <= 0}
          >
            Continuar
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Cancelar
          </Button>
        </FadeIn>
      </main>
    </div>
  );
};

export default AddIncome;

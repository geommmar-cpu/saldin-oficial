import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";

export const AddExpense = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const [amount, setAmount] = useState("");

  const handleKeyPress = (key: string) => {
    const currentDigits = amount.replace(/[^\d]/g, "");
    
    if (key === "backspace") {
      const newDigits = currentDigits.slice(0, -1);
      setAmount(newDigits ? formatCurrencyInput(newDigits) : "");
    } else if (key >= "0" && key <= "9") {
      if (currentDigits.length >= 12) return;
      const newDigits = currentDigits + key;
      setAmount(formatCurrencyInput(newDigits));
    }
  };

  const handleContinue = () => {
    const numericAmount = parseCurrency(amount);
    if (numericAmount <= 0) return;
    navigate("/confirm/new", { state: { amount: numericAmount } });
  };

  const openWhatsApp = () => {
    const whatsappUrl = "https://wa.me/5511999999999";
    window.open(whatsappUrl, "_blank");
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Novo Gasto</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5">
        {/* Amount Display */}
        <FadeIn className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-2">Valor gasto</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl text-muted-foreground">R$</span>
            <motion.span
              key={amount}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="font-serif text-6xl font-semibold tabular-nums"
            >
              {amount || "0,00"}
            </motion.span>
          </div>
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
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
            {keys.map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => key !== "," && handleKeyPress(key)}
                disabled={key === ","}
                className={`h-16 rounded-xl text-2xl font-medium transition-colors ${
                  key === "backspace"
                    ? "bg-muted text-muted-foreground"
                    : key === ","
                    ? "bg-card border border-border text-muted-foreground/30 cursor-default"
                    : "bg-card border border-border hover:bg-secondary"
                }`}
              >
                {key === "backspace" ? "⌫" : key}
              </motion.button>
            ))}
          </div>
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

      <BottomNav />
    </div>
  );
};

export default AddExpense;

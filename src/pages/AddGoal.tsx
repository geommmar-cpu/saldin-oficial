import { useState } from "react";
import { toLocalDateString } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FadeIn } from "@/components/ui/motion";
import { BottomNav } from "@/components/BottomNav";
import {
  ArrowLeft,
  Target,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Calendar,
  Loader2,
  Users,
  Vibrate,
} from "lucide-react";
import { useCreateGoal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";
import { CurrencyInput } from "@/components/ui/currency-input";

const vibrate = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

// Cores disponíveis
const colorOptions = [
  { id: 'green', label: 'Verde', class: 'bg-essential' },
  { id: 'blue', label: 'Azul', class: 'bg-calm' },
  { id: 'purple', label: 'Roxo', class: 'bg-pleasure' },
  { id: 'orange', label: 'Laranja', class: 'bg-obligation' },
  { id: 'red', label: 'Vermelho', class: 'bg-impulse' },
  { id: 'pink', label: 'Rosa', class: 'bg-pink-500' },
];

// Ícones disponíveis
const iconOptions = [
  { id: 'target', label: 'Alvo', icon: Target },
  { id: 'piggy', label: 'Cofre', icon: PiggyBank },
  { id: 'trending', label: 'Crescimento', icon: TrendingUp },
  { id: 'sparkles', label: 'Estrelas', icon: Sparkles },
];

export default function AddGoal() {
  const navigate = useNavigate();
  const createGoal = useCreateGoal();

  const [step, setStep] = useState<'amount' | 'details'>('amount');
  const [amount, setAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isPersonal, setIsPersonal] = useState(true);

  const targetAmount = parseCurrency(amount);
  const initialAmountNum = parseFloat(initialAmount.replace(',', '.')) || 0;

  const handleKeyPress = (key: string) => {
    vibrate();
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

  const handleAmountSubmit = () => {
    if (targetAmount > 0) {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || targetAmount <= 0) return;

    await createGoal.mutateAsync({
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: initialAmountNum,
      target_date: targetDate || null,
      color: 'green',
      icon: 'target',
      notes: notes.trim() || null,
      is_personal: isPersonal,
      status: initialAmountNum >= targetAmount ? 'completed' : 'in_progress',
    });

    navigate('/');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-24">
        {/* Header */}
        <header className="px-5 pt-safe-top">
          <div className="pt-4 pb-2 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">Nova Meta</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col px-5">
          {/* Amount Display */}
          <FadeIn className="flex-1 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-2">Quanto você quer guardar?</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl text-muted-foreground">R$</span>
              <motion.span
                key={amount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-serif text-6xl font-semibold tabular-nums text-essential"
              >
                {amount || "0,00"}
              </motion.span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
              Defina o valor objetivo da sua meta financeira
            </p>
          </FadeIn>

          {/* Keypad */}
          <FadeIn delay={0.2} className="pb-6">
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {keys.map((key) => (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => key !== "," && handleKeyPress(key)}
                  disabled={key === ","}
                  className={`h-16 rounded-xl text-2xl font-medium transition-colors ${key === "backspace"
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

          {/* Buttons */}
          <FadeIn delay={0.3} className="pb-4 space-y-2">
            <Button
              variant="warm"
              size="lg"
              className="w-full"
              onClick={handleAmountSubmit}
              disabled={targetAmount <= 0}
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
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('amount')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold">Detalhes da Meta</h1>
            <p className="text-sm text-muted-foreground">
              Objetivo: {formatCurrency(targetAmount)}
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
        {/* Nome */}
        <FadeIn>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da meta *</label>
            <Input
              placeholder="Ex: Viagem, Reserva de emergência..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </FadeIn>

        {/* Valor inicial */}
        <FadeIn delay={0.05}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor inicial (opcional)</label>
            <p className="text-xs text-muted-foreground">
              Já tem algum dinheiro guardado para esta meta?
            </p>
            <div className="relative">
              <CurrencyInput
                value={initialAmount}
                onChange={setInitialAmount}
              />
            </div>
          </div>
        </FadeIn>

        {/* Data objetivo */}
        <FadeIn delay={0.1}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data objetivo (opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={toLocalDateString()}
              />
            </div>
          </div>
        </FadeIn>

        {/* Observação */}
        <FadeIn delay={0.15}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observação (opcional)</label>
            <Textarea
              placeholder="Adicione uma nota..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </FadeIn>

        {/* Avaliar impacto no saldo */}
        <FadeIn delay={0.2}>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Esta meta afeta meu saldo?</p>
                <p className="text-xs text-muted-foreground">
                  {isPersonal ? "Sim, o valor guardado será subtraído do saldo livre." : "Não, é apenas para controle (ex: meta conjunta ou para terceiros)"}
                </p>
              </div>
              <Switch
                checked={isPersonal}
                onCheckedChange={setIsPersonal}
              />
            </div>
          </Card>
        </FadeIn>

        {/* Submit Button */}
        <FadeIn delay={0.35}>
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!name.trim() || createGoal.isPending}
          >
            {createGoal.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar meta'
            )}
          </Button>
        </FadeIn>
      </main>
    </div>
  );
}

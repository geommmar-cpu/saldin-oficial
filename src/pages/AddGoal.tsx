import { useState } from "react";
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
} from "lucide-react";
import { useCreateGoal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";

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
  const [selectedColor, setSelectedColor] = useState('green');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [isPersonal, setIsPersonal] = useState(true);

  const targetAmount = parseCurrency(amount);
  const initialAmountNum = parseFloat(initialAmount.replace(',', '.')) || 0;

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
      color: selectedColor,
      icon: selectedIcon,
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
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('amount')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold">Detalhes da Meta</h1>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-10"
                placeholder="0,00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
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
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </FadeIn>

        {/* Cor */}
        <FadeIn delay={0.15}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor da caixinha</label>
            <div className="flex gap-3 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    color.class,
                    selectedColor === color.id 
                      ? "ring-2 ring-offset-2 ring-foreground scale-110" 
                      : "hover:scale-105"
                  )}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Ícone */}
        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícone</label>
            <div className="flex gap-3 flex-wrap">
              {iconOptions.map((iconOpt) => {
                const Icon = iconOpt.icon;
                return (
                  <button
                    key={iconOpt.id}
                    onClick={() => setSelectedIcon(iconOpt.id)}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2",
                      selectedIcon === iconOpt.id 
                        ? "border-foreground bg-muted scale-105" 
                        : "border-border hover:border-muted-foreground"
                    )}
                    title={iconOpt.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Observação */}
        <FadeIn delay={0.25}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observação (opcional)</label>
            <Textarea
              placeholder="Adicione uma nota sobre essa meta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </FadeIn>

        {/* Meta para outra pessoa */}
        <FadeIn delay={0.28}>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Meta para outra pessoa</p>
                  <p className="text-xs text-muted-foreground">
                    Não afeta seu saldo livre
                  </p>
                </div>
              </div>
              <Switch
                checked={!isPersonal}
                onCheckedChange={(checked) => setIsPersonal(!checked)}
              />
            </div>
          </Card>
        </FadeIn>

        {/* Preview */}
        <FadeIn delay={0.3}>
          <Card className={cn(
            "p-4 border-2",
            `border-${selectedColor === 'green' ? 'essential' : selectedColor === 'blue' ? 'calm' : selectedColor === 'purple' ? 'pleasure' : selectedColor === 'orange' ? 'obligation' : selectedColor === 'red' ? 'impulse' : 'pink-500'}/30`
          )}>
            <p className="text-xs text-muted-foreground mb-2">Prévia da sua caixinha</p>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                colorOptions.find(c => c.id === selectedColor)?.class + '/20'
              )}>
                {(() => {
                  const Icon = iconOptions.find(i => i.id === selectedIcon)?.icon || Target;
                  return <Icon className={cn(
                    "w-6 h-6",
                    selectedColor === 'green' ? 'text-essential' :
                    selectedColor === 'blue' ? 'text-calm' :
                    selectedColor === 'purple' ? 'text-pleasure' :
                    selectedColor === 'orange' ? 'text-obligation' :
                    selectedColor === 'red' ? 'text-impulse' : 'text-pink-500'
                  )} />;
                })()}
              </div>
              <div>
                <p className="font-semibold">{name || 'Nome da meta'}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(initialAmountNum)} de {formatCurrency(targetAmount)}
                </p>
              </div>
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

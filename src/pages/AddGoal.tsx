import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  Target, 
  PiggyBank, 
  TrendingUp, 
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import { useCreateGoal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { parseCurrency } from "@/lib/currency";

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
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('green');
  const [selectedIcon, setSelectedIcon] = useState('target');

  const targetAmount = parseCurrency(targetAmountStr);
  const initialAmountNum = parseFloat(initialAmount.replace(',', '.')) || 0;

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
      status: initialAmountNum >= targetAmount ? 'completed' : 'in_progress',
    });

    navigate('/goals');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="px-5 pt-safe-top bg-background border-b border-border">
          <div className="py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-bold">Nova Meta</h1>
              <p className="text-sm text-muted-foreground">Valor objetivo</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col px-5 py-6">
          <FadeIn className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <p className="text-muted-foreground mb-2">Quanto você quer guardar?</p>
              <div className="text-4xl font-serif font-bold text-essential">
                {formatCurrency(targetAmount)}
              </div>
            </div>

            <CurrencyInput
              value={targetAmountStr}
              onChange={setTargetAmountStr}
              autoFocus
            />
          </FadeIn>

          <div className="mt-6">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleAmountSubmit}
              disabled={targetAmount <= 0}
            >
              Continuar
            </Button>
          </div>
        </main>
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

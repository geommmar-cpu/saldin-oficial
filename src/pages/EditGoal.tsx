import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  Target, 
  PiggyBank, 
  TrendingUp, 
  Sparkles,
  Calendar,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useGoalById, useUpdateGoal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";

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

export default function EditGoal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: goal, isLoading } = useGoalById(id);
  const updateGoal = useUpdateGoal();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('green');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [isPersonal, setIsPersonal] = useState(true);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.target_amount));
      setTargetDate(goal.target_date || '');
      setNotes(goal.notes || '');
      setSelectedColor(goal.color || 'green');
      setSelectedIcon(goal.icon || 'target');
      setIsPersonal(goal.is_personal !== false);
    }
  }, [goal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Meta não encontrada</h2>
        <Button onClick={() => navigate('/goals')}>Voltar para metas</Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!name.trim() || !targetAmount) return;

    const newTargetAmount = parseFloat(targetAmount);
    if (isNaN(newTargetAmount) || newTargetAmount <= 0) return;

    // Check if goal should be marked as completed
    const isCompleted = Number(goal.current_amount) >= newTargetAmount;

    await updateGoal.mutateAsync({
      id: goal.id,
      name: name.trim(),
      target_amount: newTargetAmount,
      target_date: targetDate || null,
      color: selectedColor,
      icon: selectedIcon,
      notes: notes.trim() || null,
      is_personal: isPersonal,
      status: isCompleted ? 'completed' : 'in_progress',
    });

    navigate(`/goals/${goal.id}`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold">Editar Meta</h1>
            <p className="text-sm text-muted-foreground">
              Guardado: {formatCurrency(Number(goal.current_amount))}
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
            />
          </div>
        </FadeIn>

        {/* Valor objetivo */}
        <FadeIn delay={0.05}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor objetivo *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-10"
                placeholder="0,00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            {parseFloat(targetAmount) < Number(goal.current_amount) && (
              <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                O valor objetivo é menor que o valor já guardado
              </p>
            )}
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

        {/* Submit Button */}
        <FadeIn delay={0.3}>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={!name.trim() || !targetAmount || updateGoal.isPending}
          >
            {updateGoal.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </FadeIn>
      </main>
    </div>
  );
}

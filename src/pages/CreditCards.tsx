import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Plus, CreditCard as CreditCardIcon, ChevronRight } from "lucide-react";
import { useCreditCards } from "@/hooks/useCreditCards";
import { cn } from "@/lib/utils";

const CARD_COLORS: Record<string, string> = {
  "#8B5CF6": "from-violet-500 to-purple-700",
  "#3B82F6": "from-blue-500 to-indigo-700",
  "#10B981": "from-emerald-500 to-teal-700",
  "#F59E0B": "from-amber-500 to-orange-700",
  "#EF4444": "from-red-500 to-rose-700",
  "#EC4899": "from-pink-500 to-fuchsia-700",
  "#6366F1": "from-indigo-500 to-violet-700",
  "#14B8A6": "from-teal-500 to-cyan-700",
};

const getGradient = (color: string) => CARD_COLORS[color] || "from-violet-500 to-purple-700";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function CreditCards() {
  const navigate = useNavigate();
  const { data: cards = [], isLoading } = useCreditCards();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold flex-1">Meus Cartões</h1>
          <Button variant="warm" size="sm" className="gap-1" onClick={() => navigate("/cards/add")}>
            <Plus className="w-4 h-4" />
            Novo
          </Button>
        </div>
      </header>

      <main className="px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <FadeIn className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCardIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Cadastre seus cartões de crédito para controlar faturas e parcelas.
            </p>
            <Button variant="warm" onClick={() => navigate("/cards/add")} className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar cartão
            </Button>
          </FadeIn>
        ) : (
          cards.map((card, index) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => navigate(`/cards/${card.id}`)}
              className="w-full text-left"
            >
              <div className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br shadow-lg",
                getGradient(card.color)
              )}>
                {/* Card chip decoration */}
                <div className="absolute top-4 right-4 opacity-20">
                  <CreditCardIcon className="w-16 h-16" />
                </div>

                <div className="relative z-10">
                  <p className="text-sm opacity-80 mb-1">{card.card_brand || "Cartão"}</p>
                  <h3 className="text-xl font-bold mb-4">{card.card_name}</h3>

                  {card.last_four_digits && (
                    <p className="text-sm opacity-70 font-mono mb-3">
                      •••• •••• •••• {card.last_four_digits}
                    </p>
                  )}

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs opacity-60">Limite</p>
                      <p className="text-lg font-semibold">{formatCurrency(card.credit_limit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-60">Vencimento</p>
                      <p className="text-sm font-medium">Dia {card.due_day}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-60" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}

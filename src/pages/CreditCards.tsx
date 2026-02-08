import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Plus, CreditCard as CreditCardIcon, ChevronRight } from "lucide-react";
import { useCreditCards } from "@/hooks/useCreditCards";
import { cn } from "@/lib/utils";
import { detectBank, detectBrand, getCardColor } from "@/lib/cardBranding";

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
              <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
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
          cards.map((card, index) => {
            const bankTheme = detectBank(card.card_name);
            const brand = detectBrand(card.card_brand);
            const cardColor = getCardColor(card.color, card.card_name);

            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => navigate(`/cards/${card.id}`)}
                className="w-full text-left"
              >
                <div
                  className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${cardColor}, ${cardColor}cc)`,
                  }}
                >
                  {/* Brand badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {brand && (
                      <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                        {brand.abbr}
                      </span>
                    )}
                    <CreditCardIcon className="w-10 h-10 opacity-20" />
                  </div>

                  <div className="relative z-10">
                    {/* Bank icon */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {bankTheme.name.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 font-medium">
                        {card.card_brand || bankTheme.name}
                      </p>
                    </div>

                    <h3 className="text-xl font-bold mb-3">{card.card_name}</h3>

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
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}

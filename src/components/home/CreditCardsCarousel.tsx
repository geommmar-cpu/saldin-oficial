import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CreditCard, Calendar, Smartphone as PhoneIcon } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { CreditCard as CreditCardType } from "@/types/creditCard";
import { detectBank } from "@/lib/cardBranding";
import { BankLogo } from "@/components/BankLogo";

interface CreditCardsCarouselProps {
    cards: CreditCardType[];
    installments: any[];
    selectedMonth: Date;
}

export const CreditCardsCarousel = ({ cards, installments, selectedMonth }: CreditCardsCarouselProps) => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const defaultCardId = (profile as any)?.wa_default_expense_card_id;

    if (cards.length === 0) return null;

    // Calculate invoice total for each card for the selected month
    const cardTotals = cards.map(card => {
        const total = installments
            .filter(inst => inst.purchase?.card_id === card.id)
            .reduce((sum, inst) => sum + Number(inst.amount), 0);

        const limit = card.credit_limit || 0;
        const usage = limit > 0 ? (total / limit) * 100 : 0;

        // Detect bank theme for colors
        const bankTheme = detectBank(card.card_name, null);

        return { ...card, currentInvoice: total, usage, limit, bankTheme };
    });

    return (
        <div
            className="w-full max-w-full pb-6 pt-2 px-1"
            style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
            }}
        >
            <div className="flex gap-4 snap-x snap-mandatory min-w-full w-max px-4 sm:px-0">
                {cardTotals.map((card, index) => (
                    <motion.div
                        key={card.id}
                        onClick={() => navigate(`/cards/${card.id}`)}
                        className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[180px] rounded-[1.5rem] p-5 relative overflow-hidden shadow-lg first:ml-0 last:mr-4 group border-0 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-backwards cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}

                    >
                        {/* Card Dynamic Background */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-100 transition-all duration-300",
                            card.bankTheme.gradient || "from-slate-700 to-slate-900"
                        )} />

                        {/* Overlay for texture/readability */}
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full justify-between text-white">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <BankLogo
                                        bankName={card.card_name}
                                        className="w-10 h-10 border-white/20 bg-white/20 backdrop-blur-md"
                                        iconClassName="text-white"
                                        size="md"
                                    />

                                    <div>
                                        <p className="text-sm font-bold tracking-wide drop-shadow-sm">
                                            {card.card_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="text-[10px] font-mono tracking-wider">•••• {card.last_four_digits || "0000"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Flag Placeholder */}
                                <div className="opacity-90">
                                    {card.card_brand && (
                                        <span className="font-bold text-xs italic tracking-wider uppercase opacity-80">{card.card_brand}</span>
                                    )}
                                    {card.id === defaultCardId && (
                                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10 ml-2">
                                            <PhoneIcon className="w-2.5 h-2.5 text-white" />
                                            <span className="text-[7px] font-bold uppercase tracking-widest text-white">Principal</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Amount */}
                            <div className="mt-2">
                                <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">Fatura Atual</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-medium opacity-80">R$</span>
                                    <p className="font-sans text-3xl font-bold tracking-tight drop-shadow-md">
                                        {formatCurrency(card.currentInvoice).replace("R$", "").trim()}
                                    </p>
                                </div>
                            </div>

                            {/* Footer: Due Date & Limit */}
                            <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/10">
                                <div>
                                    <p className="text-[10px] opacity-70 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Vence dia {card.due_day}
                                    </p>
                                </div>

                                {/* Enhanced Limit Display */}
                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] opacity-70 mb-1">Limite Usado</p>
                                        <p className="text-xs font-medium tracking-tight">
                                            <span className="font-bold">{formatCurrency(card.currentInvoice)}</span>
                                            <span className="opacity-60 mx-1">de</span>
                                            <span>{formatCurrency(card.limit)}</span>
                                        </p>
                                    </div>
                                    {/* Visual Progress Bar */}
                                    <div className="h-1.5 w-24 bg-white/20 rounded-full overflow-hidden mt-1 ml-auto backdrop-blur-sm">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                card.usage > 90 ? "bg-red-400" : "bg-white"
                                            )}
                                            style={{ width: `${Math.min(card.usage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

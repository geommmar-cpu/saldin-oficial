import { motion } from "framer-motion";

interface AmountDisplayProps {
  amount: string;
  label?: string;
}

/**
 * AmountDisplay - Exibe o valor formatado com animação
 */
export const AmountDisplay = ({ amount, label = "Valor" }: AmountDisplayProps) => {
  // Format amount for display
  const formatDisplayAmount = (value: string) => {
    if (!value) return "0,00";
    
    // If there's no comma, add ,00
    if (!value.includes(",")) {
      return value + ",00";
    }
    
    // Pad decimal places
    const [integer, decimal] = value.split(",");
    return `${integer || "0"},${(decimal || "").padEnd(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl text-muted-foreground">R$</span>
        <motion.span
          key={amount}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-serif text-6xl font-semibold tabular-nums"
        >
          {formatDisplayAmount(amount)}
        </motion.span>
      </div>
    </div>
  );
};

export default AmountDisplay;

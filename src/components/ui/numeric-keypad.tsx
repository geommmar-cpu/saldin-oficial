import { motion } from "framer-motion";
import { formatCurrencyInput } from "@/lib/currency";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * NumericKeypad - Teclado numérico para entrada de valores monetários
 * 
 * Comportamento:
 * - A vírgula é posicionada automaticamente (últimos 2 dígitos são centavos)
 * - Apenas números são aceitos
 * - Backspace para apagar
 */
export const NumericKeypad = ({
  value,
  onChange,
}: NumericKeypadProps) => {
  const handleKeyPress = (key: string) => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Extract raw digits from current formatted value
    const currentDigits = value.replace(/[^\d]/g, "");

    if (key === "backspace") {
      const newDigits = currentDigits.slice(0, -1);
      onChange(newDigits ? formatCurrencyInput(newDigits) : "");
    } else if (key >= "0" && key <= "9") {
      // Limit to reasonable amount (max 12 digits)
      if (currentDigits.length >= 12) return;
      const newDigits = currentDigits + key;
      onChange(formatCurrencyInput(newDigits));
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

  return (
    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto" data-testid="numeric-keypad">
      {keys.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => key !== "," && handleKeyPress(key)}
          disabled={key === ","}
          data-testid={`keypad-key-${key}`}
          aria-label={key === "backspace" ? "Apagar" : key === "," ? "Vírgula" : `Número ${key}`}
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
  );
};

export default NumericKeypad;

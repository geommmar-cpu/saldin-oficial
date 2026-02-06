import { motion } from "framer-motion";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxDecimalPlaces?: number;
}

/**
 * NumericKeypad - Teclado numérico para entrada de valores monetários
 * 
 * Comportamento:
 * - Permite dígitos de 0-9
 * - Vírgula para separador decimal (máximo 2 casas)
 * - Backspace para apagar
 */
export const NumericKeypad = ({ 
  value, 
  onChange, 
  maxDecimalPlaces = 2 
}: NumericKeypadProps) => {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else if (key === "," && !value.includes(",")) {
      onChange(value + ",");
    } else if (key !== ",") {
      // Limit decimal places
      const parts = value.split(",");
      if (parts[1]?.length >= maxDecimalPlaces) return;
      onChange(value + key);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"];

  return (
    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
      {keys.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => handleKeyPress(key)}
          className={`h-16 rounded-xl text-2xl font-medium transition-colors ${
            key === "backspace"
              ? "bg-muted text-muted-foreground"
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

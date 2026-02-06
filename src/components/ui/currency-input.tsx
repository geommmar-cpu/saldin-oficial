import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrencyInput } from "@/lib/currency";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  value: string;
  onChange: (value: string) => void;
  showPrefix?: boolean;
  inputSize?: "default" | "sm" | "lg" | "xl";
}

/**
 * CurrencyInput - Componente padronizado para entrada de valores monetários
 * 
 * Comportamento:
 * - A vírgula é posicionada automaticamente (últimos 2 dígitos são sempre centavos)
 * - Apenas números são aceitos
 * - Formatação em tempo real no padrão brasileiro (1.234,56)
 * 
 * @example
 * const [amount, setAmount] = useState("");
 * <CurrencyInput value={amount} onChange={setAmount} />
 * 
 * Para obter o valor numérico: parseCurrency(amount)
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showPrefix = true, inputSize = "default", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrencyInput(e.target.value);
      onChange(formatted);
    };

    const sizeClasses = {
      sm: "h-10 text-base",
      default: "h-12 text-lg",
      lg: "h-14 text-xl font-semibold",
      xl: "h-16 text-2xl font-semibold",
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            inputSize === "xl" && "text-lg",
            inputSize === "lg" && "text-base",
          )}>
            R$
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="0,00"
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showPrefix && "pl-10",
            inputSize === "xl" && showPrefix && "pl-12",
            sizeClasses[inputSize],
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };

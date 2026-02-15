import { useState } from "react";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBankLogoUrl } from "@/lib/bankLogos";

interface BankLogoProps {
    bankName: string;
    className?: string;
    iconClassName?: string;
    color?: string;
    size?: "sm" | "md" | "lg";
}

export const BankLogo = ({
    bankName,
    className,
    iconClassName,
    color,
    size = "md"
}: BankLogoProps) => {
    const [imgError, setImgError] = useState(false);
    const logoUrl = getBankLogoUrl(bankName);
    const showImage = logoUrl && !imgError;

    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };

    const iconSizeClasses = {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    if (showImage) {
        return (
            <div className={cn(
                sizeClasses[size],
                "rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-border/10",
                className
            )}>
                <img
                    src={logoUrl!}
                    alt={bankName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                sizeClasses[size],
                "rounded-full flex items-center justify-center border border-border/20 shadow-sm",
                !color && "bg-muted",
                className
            )}
            style={color ? { backgroundColor: color + "20" } : {}}
        >
            {bankName && bankName !== "Outro" && bankName !== "outros" ? (
                <span className={cn(
                    "font-bold text-[10px] tracking-tighter leading-none",
                    !color && "text-muted-foreground"
                )} style={color ? { color } : {}}>
                    {bankName.substring(0, 2).toUpperCase()}
                </span>
            ) : (
                <Landmark className={cn(iconSizeClasses[size], !color && "text-muted-foreground", iconClassName)} style={color ? { color } : {}} />
            )}
        </div>
    );
};

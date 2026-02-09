import { motion } from "framer-motion";
import { Bitcoin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCryptoWallets } from "@/hooks/useCryptoWallets";
import { formatCryptoValue, formatCryptoQuantity } from "@/lib/cryptoPrices";
import { CRYPTO_LIST } from "@/types/cryptoWallet";

export const CryptoSummary = () => {
  const navigate = useNavigate();
  const { data: wallets = [] } = useCryptoWallets();

  if (wallets.length === 0) return null;

  const totalValue = wallets.reduce(
    (sum, w) => sum + Number(w.quantity) * Number(w.last_price),
    0
  );

  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-[#F7931A]" />
          <h3 className="font-medium text-sm">Carteira Cripto</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => navigate("/crypto")}
        >
          Ver todas
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Total */}
      <div className="mb-3 px-1">
        <p className="text-xs text-muted-foreground">Valor total em cripto</p>
        <p className="font-serif text-lg font-semibold">{formatCryptoValue(totalValue)}</p>
      </div>

      {/* Wallet cards */}
      <div className="space-y-2">
        {wallets.slice(0, 3).map((wallet) => {
          const cryptoInfo = CRYPTO_LIST.find(c => c.id === wallet.crypto_id);
          const color = cryptoInfo?.color || "#888";
          const value = Number(wallet.quantity) * Number(wallet.last_price);

          return (
            <motion.button
              key={wallet.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/crypto/${wallet.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "20" }}
              >
                <span className="text-xs font-bold" style={{ color }}>
                  {wallet.symbol}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{wallet.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                </p>
              </div>
              <p className="font-semibold text-sm tabular-nums">
                {formatCryptoValue(value, wallet.display_currency)}
              </p>
            </motion.button>
          );
        })}
      </div>

      {wallets.length > 3 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{wallets.length - 3} cripto{wallets.length - 3 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

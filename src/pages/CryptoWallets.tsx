import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Bitcoin, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useCryptoWallets, useRefreshCryptoPrices } from "@/hooks/useCryptoWallets";
import { formatCryptoValue, formatCryptoQuantity } from "@/lib/cryptoPrices";
import { CRYPTO_LIST } from "@/types/cryptoWallet";
import { motion } from "framer-motion";

export const CryptoWallets = () => {
  const navigate = useNavigate();
  const { data: wallets = [], isLoading } = useCryptoWallets();
  const refreshPrices = useRefreshCryptoPrices();

  // Sort wallets by current value (highest first)
  const sortedWallets = [...wallets].sort((a, b) => {
    const valueA = Number(a.quantity) * Number(a.last_price);
    const valueB = Number(b.quantity) * Number(b.last_price);
    return valueB - valueA;
  });

  const totalValue = sortedWallets.reduce((sum, w) => sum + Number(w.quantity) * Number(w.last_price), 0);

  const handleRefresh = () => {
    refreshPrices.mutate(wallets);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-lg sm:text-xl font-semibold truncate">Cripto</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            {wallets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                onClick={handleRefresh}
                disabled={refreshPrices.isPending}
              >
                <RefreshCw className={`w-4 h-4 sm:mr-1 ${refreshPrices.isPending ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            )}
            <Button variant="warm" size="sm" className="px-3" onClick={() => navigate("/crypto-wallet/add")}>
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Nova</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-4">
        {wallets.length > 0 && (
          <FadeIn>
            <div className="p-5 rounded-2xl bg-card border border-border shadow-medium text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor total em cripto</p>
              <p className="font-serif text-2xl font-semibold">{formatCryptoValue(totalValue)}</p>
            </div>
          </FadeIn>
        )}

        {wallets.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Bitcoin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Nenhuma cripto cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Adicione suas criptomoedas para acompanhar seu patrimônio
              </p>
              <Button variant="warm" onClick={() => navigate("/crypto-wallet/add")}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar cripto
              </Button>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {sortedWallets.map((wallet, index) => {
              const cryptoInfo = CRYPTO_LIST.find(c => c.id === wallet.crypto_id);
              const color = cryptoInfo?.color || "#888";
              const value = Number(wallet.quantity) * Number(wallet.last_price);

              return (
                <FadeIn key={wallet.id} delay={0.05 * index}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/crypto-wallet/${wallet.id}`)}
                    className="w-full p-3 sm:p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-border bg-background">
                        {cryptoInfo?.image ? (
                          <img
                            src={cryptoInfo.image}
                            alt={wallet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: color + "20" }}
                          >
                            <span className="text-xs sm:text-sm font-bold" style={{ color }}>
                              {wallet.symbol}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{wallet.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm sm:text-base tabular-nums">
                          {formatCryptoValue(value, wallet.display_currency)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatCryptoValue(Number(wallet.last_price), wallet.display_currency)}/{wallet.symbol}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </FadeIn>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CryptoWallets;

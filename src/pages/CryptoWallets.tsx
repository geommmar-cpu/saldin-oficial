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

  const totalValue = wallets.reduce((sum, w) => sum + Number(w.quantity) * Number(w.last_price), 0);

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
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-semibold">Carteira Cripto</h1>
          </div>
          <div className="flex gap-2">
            {wallets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleRefresh}
                disabled={refreshPrices.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${refreshPrices.isPending ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            )}
            <Button variant="warm" size="sm" className="gap-1" onClick={() => navigate("/crypto/add")}>
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-4">
        {wallets.length > 0 && (
          <FadeIn>
            <div className="p-5 rounded-2xl bg-card border border-border shadow-medium text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor total em cripto</p>
              <p className="font-serif text-3xl font-bold">{formatCryptoValue(totalValue)}</p>
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
              <Button variant="warm" onClick={() => navigate("/crypto/add")}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar cripto
              </Button>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet, index) => {
              const cryptoInfo = CRYPTO_LIST.find(c => c.id === wallet.crypto_id);
              const color = cryptoInfo?.color || "#888";
              const value = Number(wallet.quantity) * Number(wallet.last_price);

              return (
                <FadeIn key={wallet.id} delay={0.05 * index}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/crypto/${wallet.id}`)}
                    className="w-full p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <span className="text-sm font-bold" style={{ color }}>
                          {wallet.symbol}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{wallet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCryptoQuantity(Number(wallet.quantity), wallet.symbol)} {wallet.symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          {formatCryptoValue(value, wallet.display_currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
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

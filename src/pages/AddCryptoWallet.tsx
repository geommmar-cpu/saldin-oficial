import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCryptoWallet } from "@/hooks/useCryptoWallets";
import { CRYPTO_LIST } from "@/types/cryptoWallet";

export const AddCryptoWallet = () => {
  const navigate = useNavigate();
  const createWallet = useCreateCryptoWallet();

  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customCoinGeckoId, setCustomCoinGeckoId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<"BRL" | "USD">("BRL");

  const cryptoInfo = CRYPTO_LIST.find(c => c.id === selectedCrypto);
  const isCustom = selectedCrypto === "custom";

  const name = isCustom ? customName : cryptoInfo?.name || "";
  const symbol = isCustom ? customSymbol.toUpperCase() : cryptoInfo?.symbol || "";
  const cryptoId = isCustom ? customCoinGeckoId : cryptoInfo?.id || "";

  const canSave = name.trim().length > 0 && symbol.trim().length > 0 && parseFloat(quantity) >= 0;

  const handleSave = async () => {
    if (!canSave) return;

    await createWallet.mutateAsync({
      crypto_id: cryptoId || symbol.toLowerCase(),
      symbol: symbol.trim(),
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      display_currency: displayCurrency,
      active: true,
    });

    navigate("/crypto");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Nova Carteira Cripto</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        {/* Crypto selector */}
        <FadeIn className="mb-6">
          <label className="text-sm text-muted-foreground mb-3 block">Criptomoeda</label>
          <div className="grid grid-cols-3 gap-2">
            {CRYPTO_LIST.map((crypto) => (
              <motion.button
                key={crypto.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCrypto(crypto.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  selectedCrypto === crypto.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: crypto.color + "20" }}
                >
                  <span className="text-xs font-bold" style={{ color: crypto.color }}>
                    {crypto.symbol}
                  </span>
                </div>
                <span className="text-xs font-medium truncate w-full text-center">{crypto.name}</span>
              </motion.button>
            ))}
            {/* Outro */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCrypto("custom")}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                isCustom ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary"
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                <Bitcoin className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">Outra</span>
            </motion.button>
          </div>
        </FadeIn>

        {/* Custom crypto fields */}
        {isCustom && (
          <FadeIn className="mb-6 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome</label>
              <Input
                placeholder="Ex: Avalanche"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={40}
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Símbolo</label>
              <Input
                placeholder="Ex: AVAX"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                maxLength={10}
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ID CoinGecko (opcional)</label>
              <Input
                placeholder="Ex: avalanche-2"
                value={customCoinGeckoId}
                onChange={(e) => setCustomCoinGeckoId(e.target.value)}
                maxLength={60}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para atualizar a cotação automaticamente
              </p>
            </div>
          </FadeIn>
        )}

        {/* Quantity */}
        <FadeIn delay={0.05} className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            Quantidade {symbol && `(${symbol})`}
          </label>
          <Input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-12 text-lg font-medium"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Informe a quantidade que você possui, não o valor em reais
          </p>
        </FadeIn>

        {/* Display currency */}
        <FadeIn delay={0.1} className="mb-6">
          <label className="text-sm text-muted-foreground mb-3 block">Moeda de exibição</label>
          <div className="grid grid-cols-2 gap-2">
            {(["BRL", "USD"] as const).map((curr) => (
              <motion.button
                key={curr}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDisplayCurrency(curr)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all",
                  displayCurrency === curr
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                <span className="text-sm">{curr === "BRL" ? "🇧🇷 Real (BRL)" : "🇺🇸 Dólar (USD)"}</span>
              </motion.button>
            ))}
          </div>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          variant="warm"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={!canSave || createWallet.isPending}
        >
          {createWallet.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Cadastrar carteira
        </Button>
      </div>
    </div>
  );
};

export default AddCryptoWallet;

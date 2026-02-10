import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Bitcoin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCryptoWallet, useCreateCryptoTransaction } from "@/hooks/useCryptoWallets";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { CRYPTO_LIST } from "@/types/cryptoWallet";
import { fetchCryptoPrices, formatCryptoValue, formatCryptoQuantity } from "@/lib/cryptoPrices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type InputMode = "brl" | "quantity";

export const AddCryptoWallet = () => {
  const navigate = useNavigate();
  const createWallet = useCreateCryptoWallet();
  const createTransaction = useCreateCryptoTransaction();
  const { data: bankAccounts = [] } = useBankAccounts();

  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customCoinGeckoId, setCustomCoinGeckoId] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("brl");
  const [inputValue, setInputValue] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<"BRL" | "USD">("BRL");

  // Price state
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(false);

  const cryptoInfo = CRYPTO_LIST.find(c => c.id === selectedCrypto);
  const isCustom = selectedCrypto === "custom";

  const name = isCustom ? customName : cryptoInfo?.name || "";
  const symbol = isCustom ? customSymbol.toUpperCase() : cryptoInfo?.symbol || "";
  const cryptoId = isCustom ? customCoinGeckoId : cryptoInfo?.id || "";

  // Fetch price when crypto is selected
  useEffect(() => {
    const id = isCustom ? customCoinGeckoId : cryptoId;
    if (!id) {
      setCurrentPrice(null);
      return;
    }

    setPriceLoading(true);
    setPriceError(false);
    fetchCryptoPrices([id])
      .then((prices) => {
        const p = prices[id];
        if (p) {
          setCurrentPrice(displayCurrency === "USD" ? p.usd : p.brl);
        } else {
          setCurrentPrice(null);
          setPriceError(true);
        }
      })
      .catch(() => {
        setCurrentPrice(null);
        setPriceError(true);
      })
      .finally(() => setPriceLoading(false));
  }, [cryptoId, customCoinGeckoId, isCustom, displayCurrency]);

  // Computed values
  const rawValue = parseFloat(inputValue) || 0;
  const computedQuantity = inputMode === "brl" && currentPrice && currentPrice > 0
    ? rawValue / currentPrice
    : inputMode === "quantity" ? rawValue : 0;
  const computedValue = inputMode === "quantity" && currentPrice
    ? rawValue * currentPrice
    : inputMode === "brl" ? rawValue : 0;

  const hasInitialValue = computedQuantity > 0;
  const canSave = name.trim().length > 0 && symbol.trim().length > 0 
    && (!hasInitialValue || (selectedBankId && selectedBankId !== "none"));

  const handleSave = async () => {
    if (!canSave) return;

    if (hasInitialValue && (!selectedBankId || selectedBankId === "none")) {
      toast.error("Selecione a conta de origem para o investimento");
      return;
    }

    const wallet = await createWallet.mutateAsync({
      crypto_id: cryptoId || symbol.toLowerCase(),
      symbol: symbol.trim(),
      name: name.trim(),
      quantity: 0, // Start at 0, transaction will add
      display_currency: displayCurrency,
      active: true,
    });

    // If there's an initial deposit, create a transaction to handle bank transfer
    if (hasInitialValue && wallet) {
      await createTransaction.mutateAsync({
        wallet_id: wallet.id,
        type: "deposit",
        quantity: computedQuantity,
        price_at_time: currentPrice || 0,
        total_value: computedValue,
        bank_account_id: selectedBankId,
        notes: "Aporte inicial",
      });
    }

    navigate("/crypto");
  };

  const showCryptoSelected = selectedCrypto && (isCustom ? customName && customSymbol : true);

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
              <Input placeholder="Ex: Avalanche" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={40} className="h-12" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Símbolo</label>
              <Input placeholder="Ex: AVAX" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())} maxLength={10} className="h-12" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ID CoinGecko (opcional)</label>
              <Input placeholder="Ex: avalanche-2" value={customCoinGeckoId} onChange={(e) => setCustomCoinGeckoId(e.target.value)} maxLength={60} className="h-12" />
              <p className="text-xs text-muted-foreground mt-1">Usado para atualizar a cotação automaticamente</p>
            </div>
          </FadeIn>
        )}

        {/* Input mode toggle + value */}
        {showCryptoSelected && (
          <>
            <FadeIn delay={0.05} className="mb-4">
              <label className="text-sm text-muted-foreground mb-3 block">Como deseja informar?</label>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setInputMode("brl"); setInputValue(""); }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all text-sm",
                    inputMode === "brl"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card hover:bg-secondary"
                  )}
                >
                  💰 Valor em {displayCurrency === "BRL" ? "reais" : "dólares"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setInputMode("quantity"); setInputValue(""); }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all text-sm",
                    inputMode === "quantity"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card hover:bg-secondary"
                  )}
                >
                  🪙 Quantidade de {symbol}
                </motion.button>
              </div>
            </FadeIn>

            {/* Price status */}
            {priceLoading && (
              <FadeIn className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-xl bg-muted/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando cotação...
                </div>
              </FadeIn>
            )}

            {priceError && !priceLoading && (
              <FadeIn className="mb-4">
                <div className="flex items-center gap-2 text-sm text-warning p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4" />
                  Cotação indisponível. {inputMode === "brl" ? "Use o modo quantidade." : "O valor em reais não será calculado."}
                </div>
              </FadeIn>
            )}

            {currentPrice !== null && !priceLoading && (
              <FadeIn className="mb-4">
                <div className="text-xs text-muted-foreground p-3 rounded-xl bg-muted/50">
                  Cotação atual: <strong>{formatCryptoValue(currentPrice, displayCurrency)}</strong> por {symbol}
                </div>
              </FadeIn>
            )}

            {/* Input field */}
            <FadeIn delay={0.05} className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                {inputMode === "brl"
                  ? `Valor (${displayCurrency})`
                  : `Quantidade (${symbol})`
                }
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-12 text-lg font-medium"
                disabled={inputMode === "brl" && currentPrice === null && !priceLoading}
              />
            </FadeIn>

            {/* Conversion preview */}
            {rawValue > 0 && currentPrice !== null && currentPrice > 0 && (
              <FadeIn className="mb-6">
                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Resumo da conversão</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="text-sm font-semibold">
                        {formatCryptoQuantity(computedQuantity, symbol)} {symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-sm font-semibold">
                        {formatCryptoValue(computedValue, displayCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cotação usada</p>
                      <p className="text-sm font-medium">
                        {formatCryptoValue(currentPrice, displayCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}
          </>
        )}

        {/* Bank account selector for initial deposit */}
        {showCryptoSelected && hasInitialValue && (
          <FadeIn delay={0.08} className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">Conta de origem *</label>
            {bankAccounts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-warning p-3 rounded-xl bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Cadastre uma conta bancária antes de investir.
              </div>
            ) : (
              <>
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  O valor será transferido desta conta para a carteira cripto
                </p>
              </>
            )}
          </FadeIn>
        )}

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

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Upload, FileText, Check, Loader2, AlertCircle, X, Tag, CreditCard, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditCards, useCreateCreditCardPurchase } from "@/hooks/useCreditCards";
import { defaultCategories } from "@/lib/categories";
import { formatCurrency } from "@/lib/balanceCalculations";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { parseStatementFile, type ParsedTransaction, type ParseResult } from "@/lib/statementParser";

type Step = "upload" | "parsing" | "review" | "importing" | "done";

export default function ImportStatement() {
  const navigate = useNavigate();
  const { data: cards = [] } = useCreditCards();
  const createPurchase = useCreateCreditCardPurchase();

  const [step, setStep] = useState<Step>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [categorizingIndex, setCategorizingIndex] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "pdf") {
      toast.error("Formato não suportado. Use arquivos CSV ou PDF.");
      return;
    }

    setStep("parsing");

    try {
      const result = await parseStatementFile(file);

      if (result.transactions.length === 0) {
        toast.error(result.warnings[0] || "Nenhuma transação encontrada no arquivo.");
        setStep("upload");
        return;
      }

      setParseResult(result);
      setTransactions(result.transactions);
      setStep("review");
      toast.success(`${result.transactions.length} lançamentos encontrados!`);

      if (result.warnings.length > 0) {
        result.warnings.forEach(w => toast.warning(w, { duration: 5000 }));
      }
    } catch (err) {
      console.error("Parse error:", err);
      toast.error("Erro ao processar o arquivo. Tente novamente.");
      setStep("upload");
    }
  }, []);

  const handleStartImport = async () => {
    if (!selectedCardId) {
      toast.error("Selecione um cartão.");
      return;
    }

    const toImport = transactions.filter(t => t.selected && t.type === "purchase");
    if (toImport.length === 0) {
      toast.error("Nenhum lançamento selecionado para importação.");
      return;
    }

    setStep("importing");
    let imported = 0;

    for (const tx of toImport) {
      try {
        // If it's an installment and we have info, use totalInstallments
        const installments = tx.isInstallment && tx.totalInstallments
          ? tx.totalInstallments
          : 1;

        // For installment purchases, calculate total amount
        const totalAmount = tx.isInstallment && tx.totalInstallments
          ? tx.amount * tx.totalInstallments
          : tx.amount;

        await createPurchase.mutateAsync({
          card_id: selectedCardId,
          description: tx.description,
          total_amount: totalAmount,
          total_installments: installments,
          purchase_date: tx.date,
        });
        imported++;
        setImportProgress(Math.round((imported / toImport.length) * 100));
      } catch (err) {
        console.error("Error importing:", tx.description, err);
      }
    }

    setImportedCount(imported);
    setStep("done");
    toast.success(`${imported} de ${toImport.length} lançamentos importados!`);
  };

  const toggleLine = (idx: number) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t));
  };

  const removeLine = (idx: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== idx));
  };

  const setCategory = (idx: number, catId: string) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, categoryId: catId } : t));
    setCategorizingIndex(null);
  };

  const selectedTxs = transactions.filter(t => t.selected && t.type === "purchase");
  const totalSelected = selectedTxs.reduce((s, t) => s + t.amount, 0);
  const selectedCount = selectedTxs.length;
  const uncategorizedCount = selectedTxs.filter(t => !t.categoryId).length;
  const installmentCount = selectedTxs.filter(t => t.isInstallment).length;

  const stepDescription = {
    upload: "Envie o PDF ou CSV da fatura",
    parsing: "Processando arquivo...",
    review: `${transactions.length} lançamentos encontrados`,
    importing: "Importando...",
    done: "Importação concluída!",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (step === "upload" || step === "done") navigate(-1);
              else setStep("upload");
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Importar Fatura</h1>
              <p className="text-xs text-muted-foreground">{stepDescription[step]}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/")}>
            Cancelar
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        {/* Step: Upload */}
        {step === "upload" && (
          <FadeIn className="space-y-6">
            {cards.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="font-serif text-lg font-semibold">Nenhum cartão cadastrado</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Para importar uma fatura, primeiro cadastre o cartão de crédito correspondente.
                </p>
                <Button variant="warm" onClick={() => navigate("/cards/add")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cadastrar cartão
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold mb-2">Envie a fatura do cartão</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Aceita PDF ou CSV de qualquer banco. Os lançamentos serão lidos, validados e categorizados automaticamente.
                  </p>
                </div>

                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-sm">Clique para selecionar arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF ou CSV</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Bancos suportados:</p>
                  <p className="text-xs text-muted-foreground">
                    Nubank, Itaú, Bradesco, Santander, Inter, Banco do Brasil, Caixa, C6 Bank e outros.
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-3">Como obter o arquivo:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• No app do banco, acesse a fatura do cartão</li>
                    <li>• Procure "Exportar", "Baixar" ou "Compartilhar"</li>
                    <li>• Selecione PDF ou CSV e envie aqui</li>
                  </ul>
                </div>
              </>
            )}
          </FadeIn>
        )}

        {/* Step: Parsing */}
        {step === "parsing" && (
          <FadeIn className="text-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="font-serif text-lg font-semibold">Processando fatura...</h2>
            <p className="text-sm text-muted-foreground">Identificando transações, removendo ruído e detectando parcelas.</p>
          </FadeIn>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <FadeIn className="space-y-4">
            {/* Card selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartão de destino:
              </label>
              {cards.length === 0 ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">Nenhum cartão cadastrado.</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/cards/add")}>
                    Cadastrar cartão
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {cards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                        selectedCardId === card.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/30"
                      )}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: card.color }} />
                      {card.card_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">Selecionados</p>
                <p className="font-bold text-base">{selectedCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">Parcelados</p>
                <p className="font-bold text-base">{installmentCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold text-sm">{formatCurrency(totalSelected)}</p>
              </div>
            </div>

            {/* Warnings */}
            {uncategorizedCount > 0 && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent shrink-0" />
                <p className="text-xs text-accent">
                  {uncategorizedCount} lançamento(s) sem categoria. Toque para categorizar.
                </p>
              </div>
            )}

            {/* Transaction list */}
            <div className="space-y-2">
              {transactions.map((tx, idx) => {
                const cat = tx.categoryId ? defaultCategories.find(c => c.id === tx.categoryId) : null;
                return (
                  <div key={idx}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.015, 0.5) }}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3",
                        tx.type === "payment" && "bg-green-500/5 border-green-500/20",
                        tx.type === "purchase" && tx.selected && "bg-card border-border",
                        tx.type === "purchase" && !tx.selected && "bg-muted/30 border-border/50 opacity-60",
                        tx.type === "other" && "bg-muted/20 border-border/30 opacity-50",
                      )}
                    >
                      {tx.type === "purchase" && (
                        <button onClick={() => toggleLine(idx)} className="shrink-0">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            tx.selected ? "border-primary bg-primary" : "border-muted-foreground"
                          )}>
                            {tx.selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                          </div>
                        </button>
                      )}
                      {tx.type !== "purchase" && (
                        <div className="w-6 h-6 shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                          {tx.type === "payment" ? "💳" : "↩️"}
                        </div>
                      )}

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => tx.type === "purchase" && setCategorizingIndex(categorizingIndex === idx ? null : idx)}
                      >
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>{tx.date.split("-").reverse().join("/")}</span>
                          {tx.isInstallment && tx.currentInstallment && tx.totalInstallments && (
                            <>
                              <span>·</span>
                              <span className="text-primary font-medium">
                                {tx.currentInstallment}/{tx.totalInstallments}x
                              </span>
                            </>
                          )}
                          {cat && (
                            <>
                              <span>·</span>
                              <span className={cat.color}>{cat.name}</span>
                            </>
                          )}
                          {!cat && tx.selected && tx.type === "purchase" && (
                            <>
                              <span>·</span>
                              <span className="text-accent">Sem categoria</span>
                            </>
                          )}
                          {tx.type === "payment" && (
                            <>
                              <span>·</span>
                              <span className="text-green-500">Pagamento</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <p className={cn(
                          "font-semibold text-sm tabular-nums",
                          tx.type === "payment" && "text-green-500"
                        )}>
                          {tx.type === "payment" ? "- " : ""}{formatCurrency(tx.amount)}
                        </p>
                        {tx.type === "purchase" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeLine(idx); }}
                            className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>

                    {/* Inline category picker */}
                    <AnimatePresence>
                      {categorizingIndex === idx && tx.type === "purchase" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-muted/30 rounded-b-xl border-x border-b border-border flex flex-wrap gap-1.5">
                            {defaultCategories.slice(0, 24).map(c => (
                              <button
                                key={c.id}
                                onClick={() => setCategory(idx, c.id)}
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium border transition-all",
                                  tx.categoryId === c.id
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border bg-card hover:border-foreground/30"
                                )}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <FadeIn className="text-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="font-serif text-lg font-semibold">Importando lançamentos...</h2>
            <p className="text-sm text-muted-foreground">
              Criando compras e distribuindo parcelas nos meses correspondentes.
            </p>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${importProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{importProgress}%</p>
            </div>
          </FadeIn>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <FadeIn className="text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Importação concluída!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {importedCount} lançamento(s) importados com sucesso.
              </p>
              {installmentCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Parcelas distribuídas automaticamente nos meses correspondentes.
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/cards")}>
                Ver cartões
              </Button>
              <Button variant="warm" onClick={() => { setStep("upload"); setTransactions([]); setParseResult(null); }}>
                Importar outra
              </Button>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Footer - Review step */}
      {step === "review" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-5 pb-safe-bottom">
          <div className="py-4 flex gap-3">
            <Button variant="outline" size="lg" className="flex-1 h-14" onClick={() => { setStep("upload"); setTransactions([]); }}>
              Voltar
            </Button>
            <Button
              variant="warm"
              size="lg"
              className="flex-1 h-14 gap-2"
              onClick={handleStartImport}
              disabled={!selectedCardId || selectedCount === 0}
            >
              <Check className="w-5 h-5" />
              Importar {selectedCount}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

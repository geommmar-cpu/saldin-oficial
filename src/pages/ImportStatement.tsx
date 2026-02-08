import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Upload, FileText, Check, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditCards, useCreateCreditCardPurchase } from "@/hooks/useCreditCards";
import { defaultCategories, type CategoryConfig } from "@/lib/categories";
import { formatCurrency } from "@/lib/balanceCalculations";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedLine {
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  selected: boolean;
}

function parseCSV(text: string): ParsedLine[] {
  const lines = text.split("\n").filter(l => l.trim());
  const results: ParsedLine[] = [];

  // Try to detect header
  const firstLine = lines[0]?.toLowerCase() || "";
  const hasHeader = firstLine.includes("data") || firstLine.includes("date") || firstLine.includes("descri");
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Support both comma and semicolon separators
    const sep = line.includes(";") ? ";" : ",";
    const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ""));

    if (parts.length < 2) continue;

    // Try to find date, description, amount
    let date = "";
    let description = "";
    let amount = 0;

    for (const part of parts) {
      // Check if it's a date (DD/MM/YYYY or YYYY-MM-DD)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(part)) {
        const [d, m, y] = part.split("/");
        date = `${y}-${m}-${d}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
        date = part;
      }
      // Check if it's an amount
      else if (/^-?\s*R?\$?\s*[\d.,]+$/.test(part.replace(/\s/g, ""))) {
        const cleaned = part.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed !== 0) {
          amount = Math.abs(parsed);
        }
      }
      // Otherwise it's description
      else if (part.length > 1 && !description) {
        description = part;
      }
    }

    if (description && amount > 0) {
      // Auto-detect category
      const categoryId = autoDetectCategory(description);
      results.push({
        date: date || new Date().toISOString().split("T")[0],
        description,
        amount,
        categoryId,
        selected: true,
      });
    }
  }

  return results;
}

function autoDetectCategory(desc: string): string | null {
  const lower = desc.toLowerCase();
  const rules: [string[], string][] = [
    [["ifood", "uber eats", "rappi", "delivery"], "delivery"],
    [["restaurante", "lanchonete", "padaria", "pizza", "burger", "sushi"], "alimentacao"],
    [["mercado", "supermercado", "atacadao", "assai", "carrefour", "pao de acucar"], "mercado"],
    [["uber", "99", "cabify", "taxi"], "uber_99"],
    [["combustivel", "gasolina", "etanol", "shell", "posto", "ipiranga", "br distribuidora"], "combustivel"],
    [["farmacia", "drogasil", "drogaria", "raia", "droga"], "medicamentos"],
    [["netflix", "spotify", "amazon prime", "disney", "hbo", "youtube"], "lazer"],
    [["academia", "smart fit", "gympass", "bio ritmo"], "academia"],
    [["estacionamento", "estapar", "zona azul"], "estacionamento"],
    [["roupa", "renner", "c&a", "zara", "shein", "shopee"], "roupas"],
  ];

  for (const [keywords, catId] of rules) {
    if (keywords.some(k => lower.includes(k))) return catId;
  }
  return null;
}

export default function ImportStatement() {
  const navigate = useNavigate();
  const { data: cards = [] } = useCreditCards();
  const createPurchase = useCreateCreditCardPurchase();

  const [step, setStep] = useState<"upload" | "review" | "categorize" | "importing">("upload");
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [categorizingIndex, setCategorizingIndex] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Formato não suportado. Use arquivos CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = parseCSV(text);
      if (lines.length === 0) {
        toast.error("Nenhum lançamento encontrado no arquivo.");
        return;
      }
      setParsedLines(lines);
      setStep("review");
      toast.success(`${lines.length} lançamentos encontrados!`);
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const uncategorizedCount = parsedLines.filter(l => l.selected && !l.categoryId).length;

  const handleStartImport = async () => {
    if (!selectedCardId) {
      toast.error("Selecione um cartão.");
      return;
    }

    const toImport = parsedLines.filter(l => l.selected);
    if (toImport.length === 0) {
      toast.error("Nenhum lançamento selecionado.");
      return;
    }

    setStep("importing");
    let imported = 0;

    for (const line of toImport) {
      try {
        await createPurchase.mutateAsync({
          card_id: selectedCardId,
          description: line.description,
          total_amount: line.amount,
          total_installments: 1,
          purchase_date: line.date,
        });
        imported++;
        setImportProgress(Math.round((imported / toImport.length) * 100));
      } catch (err) {
        console.error("Error importing line:", line.description, err);
      }
    }

    toast.success(`${imported} de ${toImport.length} lançamentos importados!`);
    navigate("/cards");
  };

  const toggleLine = (idx: number) => {
    setParsedLines(prev => prev.map((l, i) => i === idx ? { ...l, selected: !l.selected } : l));
  };

  const setCategory = (idx: number, catId: string) => {
    setParsedLines(prev => prev.map((l, i) => i === idx ? { ...l, categoryId: catId } : l));
    setCategorizingIndex(null);
  };

  const totalSelected = parsedLines.filter(l => l.selected).reduce((s, l) => s + l.amount, 0);
  const selectedCount = parsedLines.filter(l => l.selected).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step === "upload" ? navigate(-1) : setStep("upload")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-xl font-semibold">Importar Fatura</h1>
            <p className="text-xs text-muted-foreground">
              {step === "upload" ? "Envie o CSV da sua fatura" :
               step === "review" ? `${parsedLines.length} lançamentos encontrados` :
               step === "importing" ? "Importando..." : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <FadeIn className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-serif text-lg font-semibold mb-2">Envie o CSV da fatura</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Exporte a fatura do seu banco em formato CSV e faça o upload aqui. Os lançamentos serão lidos automaticamente.
              </p>
            </div>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-sm">Clique para selecionar arquivo</p>
                <p className="text-xs text-muted-foreground mt-1">CSV ou TXT</p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Como obter o CSV:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• No app do seu banco, acesse a fatura do cartão</li>
                <li>• Procure a opção "Exportar" ou "Baixar fatura"</li>
                <li>• Selecione o formato CSV</li>
                <li>• Envie o arquivo aqui</li>
              </ul>
            </div>
          </FadeIn>
        )}

        {/* Step 2: Review */}
        {step === "review" && (
          <FadeIn className="space-y-4">
            {/* Card selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o cartão:</label>
              {cards.length === 0 ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">Nenhum cartão cadastrado. Cadastre um cartão primeiro.</p>
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

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground">Selecionados</p>
                <p className="font-semibold text-sm">{selectedCount} de {parsedLines.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold text-sm">{formatCurrency(totalSelected)}</p>
              </div>
            </div>

            {uncategorizedCount > 0 && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accent shrink-0" />
                <p className="text-xs text-accent">{uncategorizedCount} lançamento(s) sem categoria. Toque para categorizar.</p>
              </div>
            )}

            {/* Lines list */}
            <div className="space-y-2">
              {parsedLines.map((line, idx) => {
                const cat = line.categoryId ? defaultCategories.find(c => c.id === line.categoryId) : null;
                return (
                  <div key={idx}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3",
                        line.selected ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"
                      )}
                    >
                      <button onClick={() => toggleLine(idx)} className="shrink-0">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          line.selected ? "border-primary bg-primary" : "border-muted-foreground"
                        )}>
                          {line.selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => setCategorizingIndex(categorizingIndex === idx ? null : idx)}>
                        <p className="font-medium text-sm truncate">{line.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{line.date.split("-").reverse().join("/")}</span>
                          {cat && (
                            <>
                              <span>·</span>
                              <span className={cat.color}>{cat.name}</span>
                            </>
                          )}
                          {!cat && line.selected && (
                            <>
                              <span>·</span>
                              <span className="text-accent">Sem categoria</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-sm tabular-nums shrink-0">
                        {formatCurrency(line.amount)}
                      </p>
                    </motion.div>

                    {/* Category picker inline */}
                    <AnimatePresence>
                      {categorizingIndex === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-muted/30 rounded-b-xl border-x border-b border-border flex flex-wrap gap-1.5">
                            {defaultCategories.slice(0, 20).map(c => (
                              <button
                                key={c.id}
                                onClick={() => setCategory(idx, c.id)}
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium border transition-all",
                                  line.categoryId === c.id
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

        {/* Step 3: Importing */}
        {step === "importing" && (
          <FadeIn className="text-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="font-serif text-lg font-semibold">Importando lançamentos...</h2>
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
      </main>

      {/* Footer */}
      {step === "review" && (
        <div className="px-5 pb-safe-bottom">
          <div className="pb-4 flex gap-3">
            <Button variant="outline" size="lg" className="flex-1 h-14" onClick={() => setStep("upload")}>
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

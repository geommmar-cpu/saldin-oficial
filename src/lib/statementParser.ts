/**
 * Robust credit card statement parser for PDF and CSV files.
 * Supports all major Brazilian banks (Nubank, Itaú, Bradesco, Santander, Inter, BB, Caixa, C6, etc.)
 * Handles noise filtering, installment detection, and auto-categorization.
 */

import { defaultCategories } from "@/lib/categories";

// ─── Types ──────────────────────────────────────────────

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  categoryId: string | null;
  selected: boolean;
  isInstallment: boolean;
  currentInstallment: number | null;
  totalInstallments: number | null;
  type: "purchase" | "payment" | "other";
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  totalAmount: number;
  totalInstallmentGroups: number;
  warnings: string[];
}

// ─── Noise Patterns (lines to ignore) ───────────────────

const NOISE_PATTERNS = [
  // Barcodes and payment lines
  /^\d{5}\.\d{5}\s+\d{5}\.\d{6}/,
  /^\d{47,48}$/,
  /linha\s+digit[aá]vel/i,
  /c[oó]digo\s+de\s+barras/i,
  // Legal and informational text
  /central\s+de\s+atendimento/i,
  /ouvidoria/i,
  /sac\s+\d/i,
  /www\.\w+\.com/i,
  /cnpj[:\s]/i,
  /cpf[:\s]/i,
  /agência|conta\s+corrente/i,
  /\bpag\.\s*\d+/i,
  /página\s+\d/i,
  /demonstrativo|extrato\s+de/i,
  /total\s+(da\s+)?fatura/i,
  /encargos\s+rotat/i,
  /pagamento\s+m[ií]nimo/i,
  /vencimento/i,
  /limite\s+(de\s+cr[eé]dito|dispon[ií]vel|total)/i,
  /anuidade/i,
  /taxa\s+de\s+juros/i,
  /iof/i,
  /cet\s+/i,
  /\bcrc\b/i,
  // Purely numeric blocks (no description context)
  /^[\d\s.,/\-]+$/,
  // Very short lines (< 5 chars) that aren't amounts
  /^.{0,4}$/,
];

const SECTION_HEADERS = [
  /transa[çc][oõ]es/i,
  /lan[çc]amentos/i,
  /compras/i,
  /despesas/i,
  /pagamentos/i,
  /nacionais/i,
  /internacionais/i,
];

// ─── Date Patterns ──────────────────────────────────────

const DATE_PATTERNS = [
  // DD/MM/YYYY
  { regex: /(\d{2})\/(\d{2})\/(\d{4})/, parse: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
  // DD/MM/YY
  { regex: /(\d{2})\/(\d{2})\/(\d{2})/, parse: (m: RegExpMatchArray) => `20${m[3]}-${m[2]}-${m[1]}` },
  // DD MMM (e.g., "10 JAN", "05 FEV")
  {
    regex: /(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/i,
    parse: (m: RegExpMatchArray) => {
      const months: Record<string, string> = {
        JAN: "01", FEV: "02", MAR: "03", ABR: "04", MAI: "05", JUN: "06",
        JUL: "07", AGO: "08", SET: "09", OUT: "10", NOV: "11", DEZ: "12",
      };
      const month = months[m[2].toUpperCase()] || "01";
      const day = m[1].padStart(2, "0");
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    },
  },
  // YYYY-MM-DD
  { regex: /(\d{4})-(\d{2})-(\d{2})/, parse: (m: RegExpMatchArray) => m[0] },
  // DD.MM.YYYY
  { regex: /(\d{2})\.(\d{2})\.(\d{4})/, parse: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
];

// ─── Amount Pattern ─────────────────────────────────────

function extractAmount(text: string): number | null {
  // Match Brazilian currency values: R$ 1.234,56 or 1234,56 or -R$ 50,00
  const patterns = [
    /(-?\s*R?\$?\s*[\d]{1,3}(?:\.[\d]{3})*,\d{2})/,
    /(-?\s*R?\$?\s*[\d]+,\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
      const value = parseFloat(cleaned);
      if (!isNaN(value) && value !== 0) return value;
    }
  }
  return null;
}

// ─── Installment Detection ──────────────────────────────

interface InstallmentInfo {
  current: number;
  total: number;
}

function detectInstallment(desc: string): InstallmentInfo | null {
  const patterns = [
    /(\d{1,2})\s*\/\s*(\d{1,2})/,             // 3/10
    /(\d{1,2})\s*de\s*(\d{1,2})/i,            // 05 de 12
    /parcela\s*(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/i, // Parcela 3 de 10
    /parc\.\s*(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/i,  // Parc. 3/10
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) {
      const current = parseInt(match[1]);
      const total = parseInt(match[2]);
      if (current > 0 && total > 1 && current <= total && total <= 72) {
        return { current, total };
      }
    }
  }
  return null;
}

// ─── Transaction Type Detection ─────────────────────────

function detectTransactionType(desc: string, amount: number): "purchase" | "payment" | "other" {
  const lower = desc.toLowerCase();
  if (amount < 0 || /pagamento|pgto|pag\b/i.test(lower)) return "payment";
  if (/cr[eé]dito|estorno|devolu/i.test(lower)) return "other";
  return "purchase";
}

// ─── Auto-Categorization ────────────────────────────────

const CATEGORY_RULES: [string[], string][] = [
  [["ifood", "uber eats", "rappi", "delivery", "james"], "delivery"],
  [["restaurante", "lanchonete", "padaria", "pizza", "burger", "sushi", "bar ", "churrascaria", "cafeteria", "bistro", "cantina"], "alimentacao"],
  [["mercado", "supermercado", "atacadao", "assai", "carrefour", "pao de acucar", "extra ", "big ", "nacional", "zaffari", "dia ", "fort "], "mercado"],
  [["uber ", "99 ", "99app", "cabify", "taxi", "indrive"], "uber_99"],
  [["combustivel", "gasolina", "etanol", "shell", "posto", "ipiranga", "br distribuidora", "ale ", "petrobras"], "combustivel"],
  [["farmacia", "drogasil", "drogaria", "raia", "droga", "pague menos", "ultrafarma", "panvel"], "medicamentos"],
  [["netflix", "spotify", "amazon prime", "disney", "hbo", "youtube", "deezer", "globoplay", "paramount", "star+", "apple tv", "apple music"], "lazer"],
  [["academia", "smart fit", "gympass", "bio ritmo", "wellhub", "bluefit"], "academia"],
  [["estacionamento", "estapar", "zona azul", "park", "indigo"], "estacionamento"],
  [["renner", "c&a", "zara", "shein", "shopee", "magalu", "magazine", "americanas", "casas bahia", "centauro", "netshoes", "riachuelo", "marisa", "hering"], "roupas"],
  [["luz", "eletric", "celesc", "cemig", "cpfl", "enel", "energisa", "copel", "eletropaulo", "light"], "luz"],
  [["agua", "saneamento", "sabesp", "copasa", "casan", "embasa", "compesa"], "agua"],
  [["internet", "vivo", "claro", "tim ", "oi ", "algar"], "internet"],
  [["gas ", "gás", "comgas", "ultragaz", "supergasbras", "liquigas"], "gas"],
  [["aluguel", "rent", "imobiliaria"], "aluguel"],
  [["condominio", "condomínio"], "condominio"],
  [["escola", "faculdade", "universidade", "unesp", "unicamp", "usp", "senac", "senai", "mensalidade escolar"], "escola"],
  [["curso", "udemy", "alura", "hotmart", "eduzz"], "cursos"],
  [["viagem", "hotel", "booking", "airbnb", "latam", "gol ", "azul ", "decolar", "hurb", "123milhas"], "viagem"],
  [["pet", "petz", "cobasi", "veterinar"], "pet"],
  [["plano de saude", "unimed", "amil", "bradesco saude", "sulamerica"], "plano_saude"],
  [["presente", "gift"], "presentes"],
];

function autoDetectCategory(desc: string): string | null {
  const lower = desc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [keywords, catId] of CATEGORY_RULES) {
    if (keywords.some(k => lower.includes(k))) {
      // Verify category exists
      if (defaultCategories.some(c => c.id === catId)) return catId;
    }
  }
  return null;
}

// ─── Text Cleaning ──────────────────────────────────────

function cleanDescription(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, " ")  // Remove control characters
    .replace(/[^\w\sÀ-ÿ.,\-/()&*#@!?:;'"]/g, " ") // Remove odd chars
    .replace(/\s+/g, " ")
    .trim();
}

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(line.trim()));
}

// ─── CSV Parser ─────────────────────────────────────────

function parseCSVContent(text: string): ParsedTransaction[] {
  const lines = text.split("\n").filter(l => l.trim());
  const results: ParsedTransaction[] = [];

  // Detect header
  const firstLine = lines[0]?.toLowerCase() || "";
  const hasHeader = firstLine.includes("data") || firstLine.includes("date") || firstLine.includes("descri") || firstLine.includes("valor");
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isNoiseLine(line)) continue;

    const sep = line.includes(";") ? ";" : ",";
    const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;

    let date = "";
    let description = "";
    let amount: number | null = null;

    for (const part of parts) {
      if (!date) {
        for (const dp of DATE_PATTERNS) {
          const match = part.match(dp.regex);
          if (match) { date = dp.parse(match); break; }
        }
        if (date) continue;
      }
      if (amount === null) {
        const val = extractAmount(part);
        if (val !== null) { amount = val; continue; }
      }
      if (!description && part.length > 2) {
        description = cleanDescription(part);
      }
    }

    if (description && amount !== null && Math.abs(amount) > 0) {
      const installment = detectInstallment(description);
      const type = detectTransactionType(description, amount);
      results.push({
        date: date || new Date().toISOString().split("T")[0],
        description,
        amount: Math.abs(amount),
        categoryId: autoDetectCategory(description),
        selected: type === "purchase",
        isInstallment: !!installment,
        currentInstallment: installment?.current ?? null,
        totalInstallments: installment?.total ?? null,
        type,
      });
    }
  }

  return results;
}

// ─── PDF Parser ─────────────────────────────────────────

async function parsePDFContent(file: File): Promise<ParsedTransaction[]> {
  const pdfjsLib = await import("pdfjs-dist");
  
  // Use CDN worker to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by Y position to reconstruct lines
    const items = content.items as Array<{ str: string; transform: number[] }>;
    const lineMap = new Map<number, string[]>();

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item.str);
    }

    // Sort by Y descending (top to bottom) and join
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const line = lineMap.get(y)!.join(" ").trim();
      if (line) allLines.push(line);
    }
  }

  return extractTransactionsFromLines(allLines);
}

function extractTransactionsFromLines(lines: string[]): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  let inTransactionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if we're entering a transaction section
    if (SECTION_HEADERS.some(h => h.test(line))) {
      inTransactionSection = true;
      continue;
    }

    // Skip noise
    if (isNoiseLine(line)) continue;

    // Try to extract a transaction from this line
    let date = "";
    for (const dp of DATE_PATTERNS) {
      const match = line.match(dp.regex);
      if (match) { date = dp.parse(match); break; }
    }

    const amount = extractAmount(line);

    if (!date || amount === null) continue;

    // Extract description: text between date and amount
    let desc = line;
    // Remove date part
    for (const dp of DATE_PATTERNS) {
      desc = desc.replace(dp.regex, "");
    }
    // Remove amount part
    desc = desc.replace(/(-?\s*R?\$?\s*[\d]{1,3}(?:\.[\d]{3})*,\d{2})/, "");
    desc = desc.replace(/(-?\s*R?\$?\s*[\d]+,\d{2})/, "");
    desc = cleanDescription(desc);

    if (desc.length < 3) continue;
    if (Math.abs(amount) === 0) continue;

    const installment = detectInstallment(desc);
    const type = detectTransactionType(desc, amount);

    results.push({
      date,
      description: desc,
      amount: Math.abs(amount),
      categoryId: autoDetectCategory(desc),
      selected: type === "purchase",
      isInstallment: !!installment,
      currentInstallment: installment?.current ?? null,
      totalInstallments: installment?.total ?? null,
      type,
    });
  }

  return results;
}

// ─── Main Parse Function ────────────────────────────────

export async function parseStatementFile(file: File): Promise<ParseResult> {
  const warnings: string[] = [];
  let transactions: ParsedTransaction[] = [];

  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    try {
      transactions = await parsePDFContent(file);
    } catch (err) {
      console.error("PDF parse error:", err);
      warnings.push("Erro ao processar PDF. Tente exportar a fatura em CSV.");
      return { transactions: [], totalAmount: 0, totalInstallmentGroups: 0, warnings };
    }
  } else if (ext === "csv") {
    const text = await file.text();
    transactions = parseCSVContent(text);
  } else {
    warnings.push("Formato não suportado. Use PDF ou CSV.");
    return { transactions: [], totalAmount: 0, totalInstallmentGroups: 0, warnings };
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no arquivo.");
  }

  const uncategorized = transactions.filter(t => t.selected && !t.categoryId).length;
  if (uncategorized > 0) {
    warnings.push(`${uncategorized} lançamento(s) sem categoria identificada.`);
  }

  const installmentGroups = transactions.filter(t => t.isInstallment).length;

  return {
    transactions,
    totalAmount: transactions.filter(t => t.selected).reduce((s, t) => s + t.amount, 0),
    totalInstallmentGroups: installmentGroups,
    warnings,
  };
}

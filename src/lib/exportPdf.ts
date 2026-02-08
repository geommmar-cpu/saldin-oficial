import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency";
import { getCategoryById, defaultCategories, categoryGroups, type CategoryGroup } from "@/lib/categories";
import { calculateBalances } from "@/lib/balanceCalculations";
import { ExpenseRow } from "@/hooks/useExpenses";
import { IncomeRow } from "@/hooks/useIncomes";
import { DebtRow } from "@/hooks/useDebts";
import { ReceivableRow } from "@/hooks/useReceivables";
import type { Goal } from "@/types/goal";
import type { CreditCardInstallment, CreditCardPurchase, CreditCard } from "@/types/creditCard";
const logoSrc = "/logo-saldin-pdf.webp";

// ── Colors (RGB) ──────────────────────────────────────────────
const C = {
  primary: [48, 40, 33] as [number, number, number],       // marrom
  terracota: [212, 121, 59] as [number, number, number],    // #D4793B
  amber: [230, 171, 43] as [number, number, number],        // #E6AB2B
  green: [75, 155, 106] as [number, number, number],        // essencial
  blue: [96, 127, 160] as [number, number, number],         // obrigacao
  red: [224, 90, 59] as [number, number, number],           // impulso
  gray: [140, 140, 140] as [number, number, number],
  lightGray: [220, 220, 220] as [number, number, number],
  bg: [250, 249, 246] as [number, number, number],          // creme
  white: [255, 255, 255] as [number, number, number],
  darkBg: [45, 40, 36] as [number, number, number],
};

// ── Image helper ──────────────────────────────────────────────
function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

// ── Types ─────────────────────────────────────────────────────
interface CreditCardInstallmentWithPurchase extends CreditCardInstallment {
  purchase: CreditCardPurchase & { card: CreditCard };
}

interface ExportData {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  debts: DebtRow[];
  receivables: ReceivableRow[];
  goals: Goal[];
  creditCardInstallments?: CreditCardInstallmentWithPurchase[];
  userName?: string;
  selectedMonth: Date;
  goalsSaved: number;
}

// ── Helpers ───────────────────────────────────────────────────
const margin = 15;

function pageCheck(doc: jsPDF, y: number, needed: number = 40): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, color: [number, number, number]): number {
  y = pageCheck(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...color);
  doc.text(title, margin, y);
  // Underline
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + doc.getTextWidth(title), y + 1.5);
  return y + 7;
}

function drawDivider(doc: jsPDF, y: number): number {
  y = pageCheck(doc, y, 8);
  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
  return y + 6;
}

// ── Emotion labels ────────────────────────────────────────────
const emotionLabels: Record<string, string> = {
  essencial: "Essencial",
  pilar: "Pilar",
  conforto: "Conforto",
  impulso: "Impulso",
};

// ── Main Export ───────────────────────────────────────────────
export async function generateFinancialReport({
  incomes,
  expenses,
  debts,
  receivables,
  goals,
  creditCardInstallments = [],
  userName,
  selectedMonth,
  goalsSaved,
}: ExportData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ════════════════════════════════════════════════════════════
  // 1) HEADER WITH LOGO
  // ════════════════════════════════════════════════════════════
  // Background bar - white/cream
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, pageWidth, 52, "F");

  // Logo
  try {
    const logoBase64 = await loadImageAsBase64(logoSrc);
    doc.addImage(logoBase64, "PNG", pageWidth / 2 - 20, 4, 40, 28);
  } catch {
    // continue without logo
  }

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text("Relatorio Financeiro Mensal", pageWidth / 2, 38, { align: "center" });

  // Decorative line
  doc.setDrawColor(...C.terracota);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 30, 42, pageWidth / 2 + 30, 42);

  y = 55;

  // Month, user, generation date
  const monthLabel = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const formattedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.primary);
  doc.text(formattedMonth, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  if (userName) {
    doc.text(`Preparado para: ${userName}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 2) FINANCIAL SUMMARY (the hero section)
  // ════════════════════════════════════════════════════════════
  const totalCCInstallments = creditCardInstallments.reduce((s, i) => s + Number(i.amount), 0);
  const balances = calculateBalances(incomes, expenses, debts, selectedMonth, goalsSaved, totalCCInstallments);
  const totalReceivables = receivables
    .filter(r => r.status === "pending")
    .reduce((s, r) => s + Number(r.amount), 0);

  y = drawSectionTitle(doc, "Resumo Financeiro", y, C.terracota);

  // Summary cards - 2 columns
  const colW = (pageWidth - margin * 2 - 6) / 2;
  const summaryItems = [
    { label: "Total de Receitas", value: formatCurrency(balances.detalhes.receitasTotal), color: C.green },
    { label: "Total de Gastos (a vista)", value: formatCurrency(balances.detalhes.gastosTotal), color: C.red },
    { label: "Total em Cartao", value: formatCurrency(totalCCInstallments), color: C.blue },
    { label: "Parcelas / Dividas", value: formatCurrency(balances.detalhes.dividasAtivas), color: C.amber },
    { label: "Valores a Receber", value: formatCurrency(totalReceivables), color: C.gray },
    { label: "Total Guardado em Metas", value: formatCurrency(goalsSaved), color: C.terracota },
  ];

  const cardH = 16;
  const cardGap = 3;

  for (let i = 0; i < summaryItems.length; i += 2) {
    y = pageCheck(doc, y, cardH + 4);
    for (let j = 0; j < 2 && i + j < summaryItems.length; j++) {
      const item = summaryItems[i + j];
      const x = margin + j * (colW + 6);
      // Card background
      doc.setFillColor(248, 247, 244);
      doc.roundedRect(x, y, colW, cardH, 2, 2, "F");
      // Left color bar
      doc.setFillColor(...item.color);
      doc.rect(x, y + 2, 1.5, cardH - 4, "F");
      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.gray);
      doc.text(item.label, x + 5, y + 6);
      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...C.primary);
      doc.text(item.value, x + 5, y + 12.5);
    }
    y += cardH + cardGap;
  }

  // Highlight: Saldo Livre & Saldo Comprometido
  y += 2;
  y = pageCheck(doc, y, 22);

  // Saldo Livre big card
  const bigCardW = (pageWidth - margin * 2 - 6) / 2;
  // Saldo Livre
  doc.setFillColor(...C.green);
  doc.roundedRect(margin, y, bigCardW, 20, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text("Saldo Livre", margin + 5, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatCurrency(balances.saldoLivre), margin + 5, y + 15);

  // Saldo Comprometido
  const x2 = margin + bigCardW + 6;
  doc.setFillColor(...C.red);
  doc.roundedRect(x2, y, bigCardW, 20, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text("Saldo Comprometido", x2 + 5, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatCurrency(balances.saldoComprometido), x2 + 5, y + 15);

  y += 28;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 3) INCOMES
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Receitas", y, C.green);

  if (incomes.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray);
    doc.text("Nenhuma receita registrada neste periodo.", margin, y);
    y += 8;
  } else {
    const typeLabels: Record<string, string> = { salary: "Salario", freelance: "Freelance", investment: "Investimento", gift: "Presente", other: "Outro" };
    const incomeRows = incomes.map(i => [
      i.description || "--",
      typeLabels[i.type || ""] || i.type || "--",
      i.is_recurring ? "Sim" : "Nao",
      new Date(i.date || i.created_at).toLocaleDateString("pt-BR"),
      formatCurrency(Number(i.amount)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Descricao", "Fonte", "Recorrente", "Data", "Valor"]],
      body: incomeRows,
      foot: [["", "", "", "Total", formatCurrency(balances.detalhes.receitasTotal)]],
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [...C.green], textColor: C.white, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.primary },
      footStyles: { fillColor: [240, 248, 240], textColor: C.green, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 245] },
      columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 4) EXPENSES BY CATEGORY
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Gastos por Categoria", y, C.red);

  // Group expenses by category
  const expensesByCategory = new Map<string, ExpenseRow[]>();
  expenses.forEach(e => {
    const catId = e.category_id || "outros";
    if (!expensesByCategory.has(catId)) expensesByCategory.set(catId, []);
    expensesByCategory.get(catId)!.push(e);
  });

  // Group by category group
  const groupOrder: CategoryGroup[] = ["contas_fixas", "impostos", "financeiro", "consumo", "moradia", "saude", "transporte", "educacao", "pessoal", "outros"];

  for (const groupKey of groupOrder) {
    const groupInfo = categoryGroups[groupKey];
    const catsInGroup = defaultCategories.filter(c => c.group === groupKey);

    // Check if any category in this group has expenses
    const groupHasData = catsInGroup.some(c => expensesByCategory.has(c.id));

    y = pageCheck(doc, y, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.terracota);
    doc.text(groupInfo.name.toUpperCase(), margin, y);
    y += 5;

    for (const cat of catsInGroup) {
      const catExpenses = expensesByCategory.get(cat.id) || [];
      const catTotal = catExpenses.reduce((s, e) => s + Number(e.amount), 0);

      y = pageCheck(doc, y, 8);

      if (catExpenses.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.gray);
        doc.text(`${cat.name} -- R$ 0,00 (sem movimentacoes)`, margin + 4, y);
        y += 5;
      } else {
        // Category name with total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.primary);
        doc.text(`${cat.name}`, margin + 4, y);
        doc.setTextColor(...C.red);
        doc.text(formatCurrency(catTotal), pageWidth - margin, y, { align: "right" });
        y += 2;

        // Individual items
        const catRows = catExpenses.map(e => [
          e.description || "--",
          emotionLabels[e.emotion || ""] || "--",
          new Date(e.date || e.created_at).toLocaleDateString("pt-BR"),
          formatCurrency(Number(e.amount)),
        ]);

        autoTable(doc, {
          startY: y,
          body: catRows,
          margin: { left: margin + 4, right: margin },
          theme: "plain",
          bodyStyles: { fontSize: 7.5, textColor: C.primary, cellPadding: 1.2 },
          columnStyles: {
            0: { cellWidth: 60 },
            3: { halign: "right", fontStyle: "bold" },
          },
        });
        y = (doc as any).lastAutoTable.finalY + 3;
      }
    }

    y += 3;
  }

  // Total geral de gastos
  y = pageCheck(doc, y, 10);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.red);
  doc.text("Total de Gastos", margin + 5, y + 7);
  doc.text(formatCurrency(balances.detalhes.gastosTotal), pageWidth - margin - 5, y + 7, { align: "right" });
  y += 16;

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 4b) CREDIT CARD PURCHASES
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Compras no Cartao de Credito", y, C.blue);

  if (creditCardInstallments.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray);
    doc.text("Nenhuma compra no cartao neste periodo.", margin, y);
    y += 8;
  } else {
    const byCard = new Map<string, CreditCardInstallmentWithPurchase[]>();
    creditCardInstallments.forEach(inst => {
      const cardName = inst.purchase?.card?.card_name || "Cartao";
      if (!byCard.has(cardName)) byCard.set(cardName, []);
      byCard.get(cardName)!.push(inst);
    });

    for (const [cardName, installments] of byCard) {
      y = pageCheck(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.blue);
      doc.text(cardName.toUpperCase(), margin, y);
      y += 4;

      const ccRows = installments.map(inst => {
        const purchase = inst.purchase;
        const refMonth = inst.reference_month
          ? new Date(inst.reference_month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
          : "--";
        return [
          purchase?.description || "--",
          new Date(purchase?.purchase_date || inst.created_at).toLocaleDateString("pt-BR"),
          `${inst.installment_number}/${purchase?.total_installments || 1}`,
          refMonth,
          formatCurrency(Number(inst.amount)),
        ];
      });

      const cardTotal = installments.reduce((s, i) => s + Number(i.amount), 0);

      autoTable(doc, {
        startY: y,
        head: [["Descricao", "Data Compra", "Parcela", "Fatura", "Valor"]],
        body: ccRows,
        foot: [["", "", "", "Total", formatCurrency(cardTotal)]],
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: { fillColor: [...C.blue], textColor: C.white, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: C.primary },
        footStyles: { fillColor: [235, 240, 248], textColor: C.blue, fontStyle: "bold", fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    y = pageCheck(doc, y, 10);
    doc.setFillColor(235, 240, 248);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.blue);
    doc.text("Total no Cartao", margin + 5, y + 7);
    doc.text(formatCurrency(totalCCInstallments), pageWidth - margin - 5, y + 7, { align: "right" });
    y += 16;
  }

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 5) DEBTS
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Dividas e Parcelas", y, C.amber);

  if (debts.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray);
    doc.text("Nenhuma divida ativa registrada.", margin, y);
    y += 8;
  } else {
    const debtRows = debts.map(d => [
      d.description || "--",
      d.creditor_name || "--",
      d.is_installment
        ? `${d.current_installment || 1}/${d.total_installments || "?"}`
        : "A vista",
      d.is_installment && d.total_installments
        ? `${(d.total_installments || 0) - (d.current_installment || 0)} restantes`
        : "--",
      formatCurrency(Number(d.installment_amount || 0)),
      formatCurrency(Number(d.total_amount || 0)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Descricao", "Credor", "Parcela", "Restantes", "Valor Mensal", "Total"]],
      body: debtRows,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [...C.amber], textColor: C.white, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.primary },
      alternateRowStyles: { fillColor: [255, 252, 240] },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // Total comprometido
    const totalDebtMonthly = debts.reduce((s, d) => s + Number(d.installment_amount || 0), 0);
    const totalDebtFull = debts.reduce((s, d) => s + Number(d.total_amount || 0), 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.gray);
    doc.text(`Valor mensal comprometido: ${formatCurrency(totalDebtMonthly)}  |  Total a pagar: ${formatCurrency(totalDebtFull)}`, margin, y);
    y += 8;
  }

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 6) RECEIVABLES
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Valores a Receber", y, C.blue);

  const pendingReceivables = receivables.filter(r => r.status === "pending");

  if (pendingReceivables.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray);
    doc.text("Nenhum valor pendente a receber.", margin, y);
    y += 8;
  } else {
    const recRows = pendingReceivables.map(r => [
      r.debtor_name || "--",
      formatCurrency(Number(r.amount)),
      r.due_date ? new Date(r.due_date).toLocaleDateString("pt-BR") : "--",
      r.status === "pending" ? "Pendente" : r.status,
      r.description || "--",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Pessoa", "Valor", "Vencimento", "Status", "Observacao"]],
      body: recRows,
      foot: [["", formatCurrency(totalReceivables), "", "", ""]],
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [...C.blue], textColor: C.white, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.primary },
      footStyles: { fillColor: [235, 240, 248], textColor: C.blue, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  }

  // Disclaimer
  y = pageCheck(doc, y, 10);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text("* Valores a receber nao estao disponiveis no saldo.", margin, y);
  y += 8;

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 7) GOALS
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Metas Financeiras", y, C.terracota);

  if (goals.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray);
    doc.text("Nenhuma meta registrada.", margin, y);
    y += 8;
  } else {
    const goalRows = goals.map(g => {
      const progress = Number(g.target_amount) > 0
        ? Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100))
        : 0;
      const statusLabel = g.status === "completed" ? "Concluida" : g.status === "paused" ? "Pausada" : "Em andamento";
      return [
        g.name,
        formatCurrency(Number(g.target_amount)),
        formatCurrency(Number(g.current_amount)),
        `${progress}%`,
        statusLabel,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Meta", "Valor Alvo", "Guardado", "Progresso", "Status"]],
      body: goalRows,
      foot: [["", "", formatCurrency(goalsSaved), "", ""]],
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [...C.terracota], textColor: C.white, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: C.primary },
      footStyles: { fillColor: [252, 245, 238], textColor: C.terracota, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [252, 249, 245] },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right", fontStyle: "bold" },
        3: { halign: "center" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════
  // 8) INSIGHTS
  // ════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, "Insights do Mes", y, C.terracota);

  y = pageCheck(doc, y, 40);

  // Background box
  const insightBoxH = 36;
  doc.setFillColor(252, 249, 245);
  doc.roundedRect(margin, y, pageWidth - margin * 2, insightBoxH, 3, 3, "F");
  doc.setDrawColor(...C.terracota);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - margin * 2, insightBoxH, 3, 3, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.primary);

  const insights: string[] = [];

  // Top category
  const catTotals = new Map<string, number>();
  expenses.forEach(e => {
    const catId = e.category_id || "outros";
    const cat = getCategoryById(catId);
    const catName = cat?.name || catId;
    catTotals.set(catName, (catTotals.get(catName) || 0) + Number(e.amount));
  });
  const topCat = [...catTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push(`Categoria que mais consumiu: ${topCat[0]} (${formatCurrency(topCat[1])})`);
  }

  // Biggest expense
  if (expenses.length > 0) {
    const biggest = expenses.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, expenses[0]);
    insights.push(`Maior gasto do mes: ${biggest.description || "--"} (${formatCurrency(Number(biggest.amount))})`);
  }

  // Comprometido %
  if (balances.detalhes.receitasTotal > 0) {
    const pctComprometido = Math.round((balances.saldoComprometido / balances.detalhes.receitasTotal) * 100);
    insights.push(`${pctComprometido}% da renda esta comprometida com dividas e parcelas.`);
  }

  // Impulse %
  const impulseTotal = expenses.filter(e => e.emotion === "impulso").reduce((s, e) => s + Number(e.amount), 0);
  if (balances.detalhes.gastosTotal > 0) {
    const pctImpulse = Math.round((impulseTotal / balances.detalhes.gastosTotal) * 100);
    insights.push(`Gastos por impulso representam ${pctImpulse}% do total de gastos.`);
  }

  if (insights.length === 0) {
    insights.push("Adicione mais movimentacoes para gerar insights automaticos.");
  }

  let insY = y + 7;
  insights.forEach(text => {
    doc.setFillColor(...C.terracota);
    doc.circle(margin + 5, insY - 1, 1, "F");
    doc.text(text, margin + 9, insY);
    insY += 7;
  });

  y += insightBoxH + 10;

  // ════════════════════════════════════════════════════════════
  // 9) LEGENDA
  // ════════════════════════════════════════════════════════════
  y = drawDivider(doc, y);
  y = drawSectionTitle(doc, "Legenda", y, C.gray);
  y = pageCheck(doc, y, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);

  const legendItems = [
    "Gasto a vista: reduz o saldo bruto imediatamente no mes em que ocorre.",
    "Compra no cartao: NAO reduz o saldo imediatamente. Entra como valor comprometido ate a fatura ser paga.",
    "Saldo Livre = Receitas - Gastos a vista - Dividas ativas - Parcelas de cartao - Metas guardadas.",
    "O valor comprometido inclui dividas, parcelas e faturas de cartao de credito abertas.",
  ];

  legendItems.forEach(text => {
    y = pageCheck(doc, y, 6);
    doc.setFillColor(...C.gray);
    doc.circle(margin + 4, y - 1, 0.8, "F");
    doc.text(text, margin + 8, y);
    y += 5;
  });

  y += 5;

  // ════════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();
    // Footer line
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, pH - 14, pageWidth - margin, pH - 14);
    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text("Saldin", margin, pH - 9);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pH - 9, { align: "center" });
    doc.text(`${new Date().getFullYear()}`, pageWidth - margin, pH - 9, { align: "right" });
  }

  // ════════════════════════════════════════════════════════════
  // SAVE
  // ════════════════════════════════════════════════════════════
  const fileName = `saldin-relatorio-${selectedMonth.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-")}.pdf`;
  doc.save(fileName);
}

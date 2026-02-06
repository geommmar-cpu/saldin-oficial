import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency";
import { getCategoryById } from "@/lib/categories";
import { ExpenseRow } from "@/hooks/useExpenses";
import { IncomeRow } from "@/hooks/useIncomes";
import { DebtRow } from "@/hooks/useDebts";
import logoSrc from "@/assets/logo-saldin-transparent.png";

// Emotion labels
const emotionLabels: Record<string, string> = {
  essencial: "Essencial",
  pilar: "Pilar",
  conforto: "Conforto",
  impulso: "Impulso",
};

// Convert image to base64
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

interface ExportData {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  debts: DebtRow[];
  userName?: string;
  selectedMonth: Date;
}

export async function generateFinancialReport({
  incomes,
  expenses,
  debts,
  userName,
  selectedMonth,
}: ExportData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  // Colors
  const primaryColor: [number, number, number] = [30, 30, 30];
  const accentColor: [number, number, number] = [76, 175, 80]; // green
  const redColor: [number, number, number] = [239, 83, 80];
  const grayColor: [number, number, number] = [130, 130, 130];

  // Load logo
  try {
    const logoBase64 = await loadImageAsBase64(logoSrc);
    doc.addImage(logoBase64, "PNG", margin, y, 28, 28);
  } catch {
    // If logo fails, continue without it
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("Saldin", margin + 32, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text("Relatório Financeiro", margin + 32, y + 19);

  // Month and date
  const monthLabel = selectedMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    pageWidth - margin,
    y + 12,
    { align: "right" }
  );
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - margin,
    y + 18,
    { align: "right" }
  );

  if (userName) {
    doc.text(userName, pageWidth - margin, y + 24, { align: "right" });
  }

  y += 35;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Summary Section
  const totalIncomes = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalDebts = debts.reduce((s, d) => s + Number(d.installment_amount || d.total_amount || 0), 0);
  const balance = totalIncomes - totalExpenses;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo do Mês", margin, y);
  y += 8;

  const summaryData = [
    ["Receitas", formatCurrency(totalIncomes)],
    ["Gastos", formatCurrency(totalExpenses)],
    ["Dívidas (parcelas)", formatCurrency(totalDebts)],
    ["Saldo (Receitas - Gastos)", formatCurrency(balance)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Valor"]],
    body: summaryData,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [45, 45, 45],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Incomes Section
  if (incomes.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...accentColor);
    doc.text("Receitas", margin, y);
    y += 6;

    const incomeRows = incomes.map((i) => [
      i.description || "—",
      i.type || "—",
      i.is_recurring ? "Sim" : "Não",
      new Date(i.date || i.created_at).toLocaleDateString("pt-BR"),
      formatCurrency(Number(i.amount)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Fonte", "Recorrente", "Data", "Valor"]],
      body: incomeRows,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [76, 175, 80],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Expenses Section
  if (expenses.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...redColor);
    doc.text("Gastos", margin, y);
    y += 6;

    const expenseRows = expenses.map((e) => {
      const cat = getCategoryById(e.category_id || "");
      return [
        e.description || "—",
        cat?.name || e.category_id || "—",
        emotionLabels[e.emotion || ""] || e.emotion || "—",
        new Date(e.date || e.created_at).toLocaleDateString("pt-BR"),
        formatCurrency(Number(e.amount)),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Categoria", "Tipo", "Data", "Valor"]],
      body: expenseRows,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [239, 83, 80],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Debts Section
  if (debts.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(180, 120, 30);
    doc.text("Dividas", margin, y);
    y += 6;

    const debtRows = debts.map((d) => [
      d.description || "—",
      d.creditor_name || "—",
      d.is_installment
        ? `${d.current_installment || 1}/${d.total_installments || "?"}`
        : "À vista",
      formatCurrency(Number(d.installment_amount || d.total_amount || 0)),
      formatCurrency(Number(d.total_amount || 0)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Credor", "Parcela", "Valor Parcela", "Total"]],
      body: debtRows,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [180, 120, 30],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Saldin • Relatório Financeiro • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Save
  const fileName = `saldin-relatorio-${selectedMonth.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-")}.pdf`;
  doc.save(fileName);
}

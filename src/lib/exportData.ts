
import { format } from "date-fns";

interface ExportDataParams {
    incomes: any[];
    expenses: any[];
    debts: any[];
    receivables: any[];
    goals: any[];
    bankAccounts: any[];
    creditCards: any[];
}

export const exportToCSV = ({ incomes, expenses, debts, receivables, goals, bankAccounts, creditCards }: ExportDataParams) => {
    // Helper to escape CSV fields for Excel (PT-BR)
    const escape = (value: any) => {
        if (value === null || value === undefined) return "";
        let stringValue = String(value);

        // Format numbers to PT-BR (comma as decimal)
        if (typeof value === 'number') {
            stringValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Escape if contains delimiter or quotes or newlines
        if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const formatDate = (date: string | Date | undefined) => {
        if (!date) return "";
        return format(new Date(date), "dd/mm/yyyy");
    };

    const rows: string[][] = [];

    // HEADER DA EMPRESA/APP
    rows.push(["SALDIN - RELATÓRIO FINANCEIRO COMPLETO"]);
    rows.push([`Gerado em: ${format(new Date(), "dd/mm/yyyy HH:mm")}`]);
    rows.push([]);

    // SECTION 1: CONTAS BANCÁRIAS
    rows.push(["----- RESUMO DE CONTAS BANCÁRIAS -----"]);
    rows.push(["Banco", "Tipo de Conta", "Saldo Atual"]);

    if (bankAccounts.length === 0) {
        rows.push(["Nenhuma conta cadastrada"]);
    } else {
        bankAccounts.forEach(b => {
            rows.push([
                escape(b.bank_name),
                escape(b.account_type === 'checking' ? 'Corrente' : b.account_type === 'savings' ? 'Poupança' : 'Investimento'),
                escape(Number(b.current_balance))
            ]);
        });
    }
    rows.push([]); // Empty row

    // SECTION 2: CARTÕES DE CRÉDITO
    rows.push(["----- CARTÕES DE CRÉDITO -----"]);
    rows.push(["Nome/Bandeira", "Dia Fechamento", "Dia Vencimento", "Limite Total"]);

    if (creditCards.length === 0) {
        rows.push(["Nenhum cartão cadastrado"]);
    } else {
        creditCards.forEach(c => {
            rows.push([
                escape(c.name),
                escape(c.closing_day),
                escape(c.due_day),
                escape(Number(c.limit_amount))
            ]);
        });
    }
    rows.push([]); // Empty row

    // SECTION 3: METAS
    rows.push(["----- METAS FINANCEIRAS -----"]);
    rows.push(["Nome da Meta", "Alvo", "Guardado", "Prazo", "Status"]);

    if (goals.length === 0) {
        rows.push(["Nenhuma meta cadastrada"]);
    } else {
        goals.forEach(g => {
            rows.push([
                escape(g.name),
                escape(Number(g.target_amount)),
                escape(Number(g.current_amount)),
                formatDate(g.target_date),
                escape(g.status === 'completed' ? 'Concluída' : 'Em andamento')
            ]);
        });
    }
    rows.push([]); // Empty row

    // SECTION 4: EXTRATO (Transações)
    rows.push(["----- EXTRATO DE MOVIMENTAÇÕES (Receitas, Despesas, Dívidas) -----"]);
    rows.push(["Data", "Tipo", "Descrição", "Categoria", "Valor", "Status", "Detalhes"]);

    // Merge and Sort Transactions
    const transactions = [
        ...incomes.map(i => ({
            date: new Date(i.date || i.created_at),
            type: "Receita",
            desc: i.description,
            cat: i.category?.name || "Outros",
            val: Number(i.amount),
            status: i.status === 'received' ? "Recebido" : "Pendente",
            details: i.is_recurring ? "Recorrente" : ""
        })),
        ...expenses.map(e => ({
            date: new Date(e.date || e.created_at),
            type: "Despesa",
            desc: e.description,
            cat: e.category?.name || "Outros",
            val: -Number(e.amount), // Negative for expenses
            status: e.status === 'paid' ? "Pago" : "Pendente",
            details: e.payment_method
        })),
        ...debts.map(d => ({
            date: new Date(d.created_at),
            type: "Dívida",
            desc: d.description,
            cat: "Dívidas",
            val: -Number(d.total_amount || 0),
            status: "Ativo",
            details: d.total_installments ? `${d.total_installments}x de R$ ${d.installment_amount}` : 'Valor único'
        })),
        ...receivables.map(r => ({
            date: new Date(r.created_at),
            type: "A Receber",
            desc: r.description,
            cat: "Empréstimos",
            val: Number(r.amount),
            status: r.status === 'received' ? "Recebido" : "Pendente",
            details: r.person_name
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

    if (transactions.length === 0) {
        rows.push(["Nenhuma movimentação registrada"]);
    } else {
        transactions.forEach(t => {
            rows.push([
                formatDate(t.date),
                escape(t.type),
                escape(t.desc),
                escape(t.cat),
                escape(t.val),
                escape(t.status),
                escape(t.details)
            ]);
        });
    }

    // Generate CSV content with SEMICOLON for PT-BR Excel compatibility
    const csvContent = rows.map(r => r.join(";")).join("\n");

    // Download with BOM for UTF-8 fix in Excel
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `saldin_balanco_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

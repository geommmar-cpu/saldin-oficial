import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBankAccountById, useUpdateBankAccount } from "@/hooks/useBankAccounts";
import { BANK_LIST } from "@/lib/cardBranding";
import { accountTypeOptions, type BankAccountType } from "@/types/bankAccount";
import { parseCurrency } from "@/lib/currency";
import { BankLogo } from "@/components/BankLogo";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBankAccounts } from "@/hooks/useBankAccounts";

export const EditBankAccount = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: account, isLoading } = useBankAccountById(id);
    const updateAccount = useUpdateBankAccount();
    const { data: profile } = useProfile();
    const updateProfile = useUpdateProfile();

    const [bankKey, setBankKey] = useState<string>("");
    const [customBankName, setCustomBankName] = useState("");
    const [accountType, setAccountType] = useState<BankAccountType>("checking");
    const [currentBalance, setCurrentBalance] = useState("");
    const [isMainAccount, setIsMainAccount] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data: accounts = [] } = useBankAccounts();

    // Find existing main account for confirmation message
    const existingIncomeAccId = (profile as any)?.wa_default_income_account_id;
    const existingIncomeAcc = accounts.find(a => a.id === existingIncomeAccId);
    const isEditingCurrentMain = existingIncomeAccId === id;

    useEffect(() => {
        if (account) {
            setBankKey(account.bank_key || "outros");
            setCustomBankName(account.bank_name);
            setAccountType(account.account_type);
            setCurrentBalance(account.current_balance.toString());

            // Check if this is the main account in profile
            if (profile) {
                const isMain = (profile as any).wa_default_income_account_id === account.id ||
                    (profile as any).wa_default_expense_account_id === account.id;
                setIsMainAccount(isMain);
            }
        }
    }, [account, profile]);

    const selectedBank = BANK_LIST.find((b) => b.key === bankKey);
    const bankName = bankKey === "outros" ? customBankName : selectedBank?.name || customBankName;

    const canSave = bankName.trim().length > 0;

    const handleSave = async () => {
        if (!canSave || !id) return;

        const balance = parseCurrency(currentBalance);

        await updateAccount.mutateAsync({
            id,
            bank_name: bankName.trim(),
            bank_key: bankKey === "outros" ? null : bankKey,
            account_type: accountType,
            current_balance: balance,
            color: selectedBank?.color || account?.color || null,
        });

        if (isMainAccount) {
            // Define como padrão no perfil
            await updateProfile.mutateAsync({
                wa_default_income_account_id: id,
                wa_default_expense_account_id: id
            } as any);
        } else {
            // Se era a principal e desmarcou, removemos (opcional, mas seguro)
            if ((profile as any).wa_default_income_account_id === id) {
                await updateProfile.mutateAsync({
                    wa_default_income_account_id: null,
                    wa_default_expense_account_id: null
                } as any);
            }
        }

        navigate(`/banks/${id}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="px-5 pt-safe-top">
                <div className="pt-4 pb-2 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/banks/${id}`)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="font-serif text-xl font-semibold">Editar Conta</h1>
                </div>
            </header>

            <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
                {/* Bank selector */}
                <FadeIn className="mb-6">
                    <label className="text-sm text-muted-foreground mb-3 block">Escolha o banco</label>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
                        {BANK_LIST.filter((b) => b.key !== "outros").map((bank) => (
                            <motion.button
                                key={bank.key}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setBankKey(bank.key);
                                    setCustomBankName("");
                                }}
                                className="flex flex-col items-center gap-2 min-w-[72px] snap-center"
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-sm",
                                    bankKey === bank.key
                                        ? "border-primary ring-2 ring-primary/20 ring-offset-2 scale-110"
                                        : "border-border bg-card hover:border-primary/50"
                                )}
                                    style={{ backgroundColor: bankKey === bank.key ? bank.color : "#ffffff" }}
                                >
                                    {bankKey === bank.key ? (
                                        <Check className="w-6 h-6 text-white" />
                                    ) : (
                                        <BankLogo bankName={bank.name} color={bank.color} size="lg" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold text-center truncate w-full transition-colors",
                                    bankKey === bank.key ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {bank.name}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </FadeIn>

                {/* Account type */}
                <FadeIn delay={0.05} className="mb-6">
                    <label className="text-sm text-muted-foreground mb-3 block">Tipo de conta</label>
                    <div className="grid grid-cols-3 gap-2">
                        {accountTypeOptions.map((opt) => (
                            <motion.button
                                key={opt.value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAccountType(opt.value)}
                                className={cn(
                                    "p-3 rounded-xl border-2 text-center transition-all",
                                    accountType === opt.value
                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                        : "border-border bg-card hover:bg-secondary"
                                )}
                            >
                                <span className="text-sm">{opt.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </FadeIn>

                {/* Balance */}
                <FadeIn delay={0.1} className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                        Saldo Atual
                    </label>
                    <CurrencyInput value={currentBalance} onChange={setCurrentBalance} />
                </FadeIn>

                {/* Main account toggle */}
                <FadeIn delay={0.15}>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-soft">
                        <div>
                            <p className="text-sm font-medium">Definir como conta principal</p>
                            <p className="text-xs text-muted-foreground">Usar para transações automáticas via WhatsApp</p>
                        </div>
                        <Switch
                            checked={isMainAccount}
                            onCheckedChange={(checked) => {
                                // Only show confirm if trying to enable on a non-main account while another exists
                                if (checked && existingIncomeAccId && !isEditingCurrentMain) {
                                    setShowConfirm(true);
                                } else {
                                    setIsMainAccount(checked);
                                }
                            }}
                        />
                    </div>
                </FadeIn>

                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Substituir conta principal?</AlertDialogTitle>
                            <AlertDialogDescription>
                                A conta <strong>{existingIncomeAcc?.bank_name}</strong> já está definida como principal.
                                Deseja que <strong>{bankName}</strong> passe a ser a padrão para o WhatsApp?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsMainAccount(false)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                setIsMainAccount(true);
                                setShowConfirm(false);
                            }}>
                                Sim, substituir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
                <Button
                    variant="warm"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleSave}
                    disabled={!canSave || updateAccount.isPending}
                >
                    {updateAccount.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Check className="w-5 h-5" />
                    )}
                    Salvar alterações
                </Button>
            </div>
        </div>
    );
};

export default EditBankAccount;

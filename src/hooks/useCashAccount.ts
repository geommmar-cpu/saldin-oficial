import { useMemo } from "react";
import { useBankAccounts, useCreateBankAccount } from "./useBankAccounts";
import { CASH_ACCOUNT_NAME, CASH_ACCOUNT_KEY } from "@/types/bankAccount";
import type { BankAccount } from "@/types/bankAccount";

/**
 * Hook to get or auto-create the "Dinheiro em mãos" cash account.
 * Returns the cash account if it exists, and a function to ensure it exists.
 */
export const useCashAccount = () => {
  const { data: accounts = [], isLoading } = useBankAccounts();
  const createAccount = useCreateBankAccount();

  const cashAccount = useMemo(() => {
    return accounts.find(
      (a) => a.bank_key === CASH_ACCOUNT_KEY || a.account_type === ("cash" as any)
    ) as BankAccount | undefined;
  }, [accounts]);

  /** Ensures the cash account exists. Returns its ID. */
  const ensureCashAccount = async (): Promise<string> => {
    if (cashAccount) return cashAccount.id;

    const result = await createAccount.mutateAsync({
      bank_name: CASH_ACCOUNT_NAME,
      bank_key: CASH_ACCOUNT_KEY,
      account_type: "cash" as any,
      initial_balance: 0,
      current_balance: 0,
      color: "#6B7280",
      active: true,
    });

    return result.id;
  };

  return {
    cashAccount,
    cashAccountId: cashAccount?.id,
    isLoading,
    ensureCashAccount,
    isCreating: createAccount.isPending,
  };
};

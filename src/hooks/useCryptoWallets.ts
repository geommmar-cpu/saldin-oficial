import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { fetchCryptoPrices } from "@/lib/cryptoPrices";
import type {
  CryptoWallet,
  CryptoWalletInsert,
  CryptoTransaction,
  CryptoTransactionInsert,
} from "@/types/cryptoWallet";

const db = supabase as any;

// ─── Wallets ────────────────────────────────────────────

export const useCryptoWallets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crypto-wallets", user?.id],
    queryFn: async () => {
      // 1. Fetch wallets
      const { data, error } = await db
        .from("crypto_wallets")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205") return [];
        throw error;
      }

      const wallets = (data || []) as CryptoWallet[];

      try {
        // 2. Automatically refresh prices in background if we have wallets
        if (wallets.length > 0) {
          // Check if any wallet hasn't been updated in the last 5 minutes
          const now = new Date();
          const needsUpdate = wallets.some(w => {
            if (!w.last_price_updated_at) return true;
            const lastUpdate = new Date(w.last_price_updated_at);
            return (now.getTime() - lastUpdate.getTime()) > 5 * 60 * 1000; // 5 mins
          });

          if (needsUpdate) {
            // Fire and forget update - don't await to return UI data faster
            const ids = [...new Set(wallets.map(w => w.crypto_id))];
            fetchCryptoPrices(ids).then(async (prices) => {
              for (const wallet of wallets) {
                const priceData = prices[wallet.crypto_id];
                if (!priceData) continue;

                const newPrice = wallet.display_currency === "USD" ? priceData.usd : priceData.brl;
                const currentPrice = Number(wallet.last_price || 0);

                // Update if price changed significantly or if it was never set
                if (Math.abs(currentPrice - newPrice) > 0.000001 || !wallet.last_price_updated_at) {
                  await db
                    .from("crypto_wallets")
                    .update({
                      last_price: newPrice,
                      last_price_updated_at: new Date().toISOString(),
                    })
                    .eq("id", wallet.id);
                }
              }
            }).catch(err => console.error("Auto-refresh crypto prices failed:", err));
          }
        }
      } catch (err) {
        console.warn("Error in crypto auto-refresh logic:", err);
      }

      return wallets;
    },
    enabled: !!user,
    retry: (count: number, err: any) => err?.code !== "PGRST205" && count < 3,
    refetchInterval: 60000, // Update every minute
  });
};

export const useCryptoWalletById = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crypto-wallet", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from("crypto_wallets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as CryptoWallet | null;
    },
    enabled: !!user && !!id,
    refetchInterval: 30000,
  });
};

export const useCreateCryptoWallet = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (wallet: Omit<CryptoWalletInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado. Faça login novamente.");

      let lastPrice = 0;
      try {
        // Fetch initial price
        const idToFetch = wallet.crypto_id?.trim();
        if (idToFetch) {
          const prices = await fetchCryptoPrices([idToFetch]);
          const price = prices[idToFetch];
          if (price) {
            lastPrice = wallet.display_currency === "USD" ? price.usd : price.brl;
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar preço inicial (prosseguindo com 0):", err);
      }

      console.log("Criando carteira:", { ...wallet, user_id: user.id, last_price: lastPrice });

      const { data, error } = await db
        .from("crypto_wallets")
        .insert({
          ...wallet,
          user_id: user.id,
          last_price: lastPrice,
          last_price_updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message || "Erro ao salvar carteira no banco de dados.");
      }
      return data as CryptoWallet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      toast.success("Carteira cripto cadastrada!");
    },
    onError: (error: Error) => {
      console.error("Error creating crypto wallet:", error);
      toast.error(`Erro ao cadastrar carteira: ${error.message}`);
    },
  });
};

export const useUpdateCryptoWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CryptoWallet> & { id: string }) => {
      const { data, error } = await db
        .from("crypto_wallets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as CryptoWallet;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto-wallet"] });
      toast.success("Carteira atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });
};

export const useDeleteCryptoWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch all transactions to reverse bank impacts
      const { data: txs } = await db
        .from("crypto_transactions")
        .select("type, total_value, bank_account_id")
        .eq("wallet_id", id);

      if (txs && txs.length > 0) {
        // Group reversals by bank_account_id
        const reversals: Record<string, number> = {};
        for (const tx of txs) {
          if (!tx.bank_account_id || !tx.total_value) continue;
          const val = Number(tx.total_value);
          // Reverse: deposit had deducted from bank, so add back; withdraw had added, so deduct
          const delta = tx.type === "deposit" ? val : tx.type === "withdraw" ? -val : 0;
          if (delta !== 0) {
            reversals[tx.bank_account_id] = (reversals[tx.bank_account_id] || 0) + delta;
          }
        }

        // Apply reversals
        for (const [bankId, delta] of Object.entries(reversals)) {
          const { data: bank } = await db
            .from("bank_accounts")
            .select("current_balance")
            .eq("id", bankId)
            .maybeSingle();
          if (bank) {
            await db
              .from("bank_accounts")
              .update({
                current_balance: Number(bank.current_balance) + delta,
                updated_at: new Date().toISOString(),
              })
              .eq("id", bankId);
          }
        }
      }

      // 2. Delete transactions then wallet
      await db.from("crypto_transactions").delete().eq("wallet_id", id);
      const { error } = await db.from("crypto_wallets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Carteira removida!");
    },
    onError: () => toast.error("Erro ao remover"),
  });
};

// ─── Price Refresh ──────────────────────────────────────

export const useRefreshCryptoPrices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wallets: CryptoWallet[]) => {
      if (wallets.length === 0) return;
      const ids = [...new Set(wallets.map(w => w.crypto_id))];
      const prices = await fetchCryptoPrices(ids);

      // Update each wallet's last_price in DB
      for (const wallet of wallets) {
        const price = prices[wallet.crypto_id];
        if (!price) continue;
        const lastPrice = wallet.display_currency === "USD" ? price.usd : price.brl;
        await db
          .from("crypto_wallets")
          .update({
            last_price: lastPrice,
            last_price_updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto-wallet"] });
    },
  });
};

// ─── Transactions ───────────────────────────────────────

export const useCryptoTransactions = (walletId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crypto-transactions", walletId],
    queryFn: async () => {
      if (!walletId) return [];
      const { data, error } = await db
        .from("crypto_transactions")
        .select("*")
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CryptoTransaction[];
    },
    enabled: !!user && !!walletId,
  });
};

export const useCreateCryptoTransaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tx: Omit<CryptoTransactionInsert, "user_id">) => {
      if (!user) throw new Error("Não autenticado");

      // 1. Insert transaction
      const { error: txError } = await db
        .from("crypto_transactions")
        .insert({ ...tx, user_id: user.id });
      if (txError) throw txError;

      // 2. Update wallet quantity
      const { data: wallet, error: wErr } = await db
        .from("crypto_wallets")
        .select("quantity")
        .eq("id", tx.wallet_id)
        .single();
      if (wErr) throw wErr;

      const currentQty = Number(wallet.quantity);
      let newQty: number;
      if (tx.type === "deposit") {
        newQty = currentQty + tx.quantity;
      } else if (tx.type === "withdraw") {
        newQty = currentQty - tx.quantity;
      } else {
        // adjustment: quantity IS the new total
        newQty = tx.quantity;
      }

      await db
        .from("crypto_wallets")
        .update({ quantity: Math.max(0, newQty), updated_at: new Date().toISOString() })
        .eq("id", tx.wallet_id);

      // 3. Update bank balance if bank_account_id is provided
      if (tx.bank_account_id && tx.total_value) {
        const { data: bank, error: bankError } = await db
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", tx.bank_account_id)
          .maybeSingle();

        if (bankError) throw new Error(`Erro ao buscar conta bancária: ${bankError.message}`);
        if (!bank) throw new Error("Conta bancária não encontrada ou deletada.");

        if (bank) {
          const bankBalance = Number(bank.current_balance);
          const delta = tx.type === "deposit" ? -tx.total_value : tx.total_value;
          await db
            .from("bank_accounts")
            .update({
              current_balance: bankBalance + delta,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tx.bank_account_id);
        }
      }

      return { newQty };
    },
    onSuccess: (_, tx) => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto-wallet"] });
      qc.invalidateQueries({ queryKey: ["crypto-transactions"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      const labels = { deposit: "Aporte registrado!", withdraw: "Resgate registrado!", adjustment: "Ajuste realizado!" };
      toast.success(labels[tx.type]);
    },
    onError: (error: Error) => {
      console.error("Tx error:", error);
      toast.error(`Erro na operação: ${error.message}`);
    },
  });
};

// ─── Stats (total value) ────────────────────────────────

export const useCryptoTotalValue = () => {
  const { data: wallets = [] } = useCryptoWallets();

  const totalBRL = wallets.reduce((sum, w) => {
    return sum + Number(w.quantity) * Number(w.last_price);
  }, 0);

  return { totalValue: totalBRL, wallets };
};
export const useCryptoInvestedInMonth = (month: number, year: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crypto-invested", user?.id, month, year],
    queryFn: async () => {
      if (!user) return 0;
      // Construct date range for the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const { data, error } = await db
        .from("crypto_transactions")
        .select("total_value")
        .eq("user_id", user.id)
        .eq("type", "deposit")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) {
        console.error("Error fetching crypto investments:", error);
        return 0;
      }

      return (data || []).reduce((sum: number, tx: any) => sum + Number(tx.total_value || 0), 0);
    },
    enabled: !!user,
  });
};

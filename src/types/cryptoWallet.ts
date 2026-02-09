export interface CryptoWallet {
  id: string;
  user_id: string;
  crypto_id: string;       // CoinGecko ID
  symbol: string;           // BTC, ETH...
  name: string;             // Bitcoin, Ethereum...
  quantity: number;
  display_currency: "BRL" | "USD";
  last_price: number;
  last_price_updated_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CryptoWalletInsert = Omit<CryptoWallet, "id" | "created_at" | "updated_at" | "user_id" | "last_price" | "last_price_updated_at"> & {
  user_id?: string;
};

export type CryptoTransactionType = "deposit" | "withdraw" | "adjustment";

export interface CryptoTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: CryptoTransactionType;
  quantity: number;
  price_at_time: number | null;
  total_value: number | null;
  bank_account_id: string | null;
  notes: string | null;
  created_at: string;
}

export type CryptoTransactionInsert = Omit<CryptoTransaction, "id" | "created_at" | "user_id"> & {
  user_id?: string;
};

// Popular cryptos for the selector
export const CRYPTO_LIST = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { id: "tether", symbol: "USDT", name: "Tether", color: "#26A17B" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", color: "#F3BA2F" },
  { id: "solana", symbol: "SOL", name: "Solana", color: "#9945FF" },
  { id: "ripple", symbol: "XRP", name: "XRP", color: "#23292F" },
  { id: "cardano", symbol: "ADA", name: "Cardano", color: "#0033AD" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "#C2A633" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", color: "#E6007A" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", color: "#2775CA" },
] as const;

export const transactionTypeLabels: Record<CryptoTransactionType, string> = {
  deposit: "Aporte",
  withdraw: "Resgate",
  adjustment: "Ajuste Manual",
};

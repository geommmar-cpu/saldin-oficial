// Bank and brand identity system for credit cards
// Uses stylized icons and colors — no proprietary logos

import { CreditCard, Landmark, Wallet, Building2, Banknote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Bank Colors ────────────────────────────────────────

export interface BankTheme {
  name: string;
  color: string;
  gradient: string;
  /** tailwind classes for bg */
  bgClass: string;
  logoUrl?: string;
}

export const BANK_THEMES: Record<string, BankTheme> = {
  nubank: { name: "Nubank", color: "#8B10AE", gradient: "from-purple-600 to-violet-800", bgClass: "bg-purple-600", logoUrl: "https://logodownload.org/wp-content/uploads/2014/05/banco-nubank-logo.png" },
  itau: { name: "Itaú", color: "#FF6200", gradient: "from-orange-500 to-orange-700", bgClass: "bg-orange-600", logoUrl: "https://logodownload.org/wp-content/uploads/2014/05/itau-logo-1.png" },
  bradesco: { name: "Bradesco", color: "#CC092F", gradient: "from-red-600 to-red-800", bgClass: "bg-red-600", logoUrl: "https://logodownload.org/wp-content/uploads/2014/02/bradesco-logo-1.png" },
  inter: { name: "Inter", color: "#FF7A00", gradient: "from-orange-500 to-orange-700", bgClass: "bg-orange-500", logoUrl: "https://logodownload.org/wp-content/uploads/2018/06/banco-inter-logo.png" },
  santander: { name: "Santander", color: "#EC0000", gradient: "from-red-500 to-red-700", bgClass: "bg-red-500", logoUrl: "https://logodownload.org/wp-content/uploads/2014/05/banco-santander-logo-11.png" },
  bb: { name: "Banco do Brasil", color: "#FDDB00", gradient: "from-yellow-400 to-yellow-600", bgClass: "bg-yellow-400", logoUrl: "https://logodownload.org/wp-content/uploads/2014/05/banco-do-brasil-logo-1.png" },
  caixa: { name: "Caixa", color: "#005CA9", gradient: "from-blue-600 to-blue-800", bgClass: "bg-blue-600", logoUrl: "https://logodownload.org/wp-content/uploads/2014/02/caixa-logo.png" },
  c6: { name: "C6 Bank", color: "#1A1A1A", gradient: "from-gray-800 to-gray-950", bgClass: "bg-gray-800", logoUrl: "https://logodownload.org/wp-content/uploads/2019/08/c6-bank-logo-1.png" },
  neon: { name: "Neon", color: "#00D1FF", gradient: "from-cyan-400 to-cyan-600", bgClass: "bg-cyan-400", logoUrl: "https://logodownload.org/wp-content/uploads/2018/06/neon-pagamentos-logo.png" },
  picpay: { name: "PicPay", color: "#21C25E", gradient: "from-green-500 to-green-700", bgClass: "bg-green-500", logoUrl: "https://logodownload.org/wp-content/uploads/2018/05/picpay-logo.png" },
  xp: { name: "XP", color: "#1D1D1B", gradient: "from-gray-800 to-gray-950", bgClass: "bg-gray-800", logoUrl: "https://logodownload.org/wp-content/uploads/2019/11/xp-investimentos-logo-0.png" },
  mercadopago: { name: "Mercado Pago", color: "#009EE3", gradient: "from-sky-500 to-sky-700", bgClass: "bg-sky-500", logoUrl: "https://logodownload.org/wp-content/uploads/2014/10/mercado-pago-logo-0.png" },
  original: { name: "Original", color: "#00A651", gradient: "from-emerald-500 to-emerald-700", bgClass: "bg-emerald-500", logoUrl: "https://logodownload.org/wp-content/uploads/2018/06/banco-original-logo-1.png" },
  pan: { name: "Banco Pan", color: "#0066CC", gradient: "from-blue-500 to-blue-700", bgClass: "bg-blue-500", logoUrl: "https://logodownload.org/wp-content/uploads/2019/10/banco-pan-logo-1.png" },
  next: { name: "Next", color: "#00E676", gradient: "from-green-400 to-green-600", bgClass: "bg-green-400", logoUrl: "https://logodownload.org/wp-content/uploads/2018/06/banco-next-logo.png" },
  outros: { name: "Outro", color: "#8B5CF6", gradient: "from-violet-500 to-purple-700", bgClass: "bg-violet-500" },
};

export const BANK_LIST = Object.entries(BANK_THEMES).map(([key, theme]) => ({
  key,
  ...theme,
}));

// ─── Brand (Bandeira) ───────────────────────────────────

export interface BrandInfo {
  name: string;
  abbr: string;
  color: string;
}

export const CARD_BRANDS: Record<string, BrandInfo> = {
  visa: { name: "Visa", abbr: "V", color: "#1A1F71" },
  mastercard: { name: "Mastercard", abbr: "MC", color: "#EB001B" },
  elo: { name: "Elo", abbr: "E", color: "#00A4E0" },
  amex: { name: "Amex", abbr: "AX", color: "#006FCF" },
  hipercard: { name: "Hipercard", abbr: "HC", color: "#822124" },
};

export const BRAND_LIST = Object.entries(CARD_BRANDS).map(([key, brand]) => ({
  key,
  ...brand,
}));

// ─── Helpers ────────────────────────────────────────────

/** Match a card_name or bank field to a known bank theme */
export function detectBank(cardName: string, bankField?: string | null): BankTheme {
  const search = (bankField || cardName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [key, theme] of Object.entries(BANK_THEMES)) {
    if (key === "outros") continue;
    const bankSearch = theme.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (search.includes(bankSearch) || search.includes(key)) {
      return theme;
    }
  }
  return BANK_THEMES.outros;
}

/** Match brand string to known brand */
export function detectBrand(brandField?: string | null): BrandInfo | null {
  if (!brandField) return null;
  const search = brandField.toLowerCase().trim();

  for (const [key, brand] of Object.entries(CARD_BRANDS)) {
    if (search.includes(key) || search.includes(brand.name.toLowerCase())) {
      return brand;
    }
  }
  return null;
}

/** Get the appropriate color for a card — user color > bank theme */
export function getCardColor(cardColor: string, cardName: string, bankField?: string | null): string {
  // If user picked a color that's not the default violet, use it
  if (cardColor && cardColor !== "#8B5CF6") {
    return cardColor;
  }
  // Otherwise, try to detect from bank
  return detectBank(cardName, bankField).color;
}

/** Get gradient for a card */
export function getCardGradient(cardName: string, bankField?: string | null): string {
  return detectBank(cardName, bankField).gradient;
}

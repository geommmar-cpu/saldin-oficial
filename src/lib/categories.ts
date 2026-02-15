// Sistema de categorias padronizadas do Saldin
// Estrutura profissional para organização e relatórios

import {
  Droplets,
  Zap,
  Wifi,
  Flame,
  Phone,
  Home,
  Car,
  FileText,
  AlertCircle,
  CreditCard,
  Layers,
  Percent,
  Building2,
  Utensils,
  ShoppingCart,
  Bike,
  PartyPopper,
  Heart,
  GraduationCap,
  Shirt,
  Plane,
  Gift,
  Stethoscope,
  Pill,
  Dumbbell,
  Dog,
  Baby,
  Wrench,
  Sparkles,
  MoreHorizontal,
  LucideIcon,
  TrendingUp,
  BarChart4,
  Laptop,
  Briefcase,
  Coffee,
  Play,
  Bus,
  Hammer,
  HeartPulse,
  Globe,
  Fuel,
  Ticket,
  Banknote,
  PlusCircle,
} from "lucide-react";

export type CategoryNature = "Fixo" | "Variável" | "Financeiro" | "Investimento" | "Renda";

export interface CategoryConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  group: CategoryGroup;
  color: string; // CSS class/color
  nature: CategoryNature;
  allowExpense?: boolean;
  allowCard?: boolean;
  allowSubscription?: boolean;
  allowImport?: boolean;
  isCustom?: boolean;
}

export type CategoryGroup =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "saude"
  | "lazer"
  | "educacao"
  | "servicos_financeiros"
  | "investimentos"
  | "receitas"
  | "outros";

export const categoryGroups: Record<CategoryGroup, { name: string; icon: LucideIcon }> = {
  moradia: { name: "Moradia", icon: Home },
  alimentacao: { name: "Alimentação", icon: Utensils },
  transporte: { name: "Transporte", icon: Car },
  saude: { name: "Saúde", icon: HeartPulse },
  lazer: { name: "Lazer", icon: PartyPopper },
  educacao: { name: "Educação", icon: GraduationCap },
  servicos_financeiros: { name: "Serviços Financeiros", icon: Banknote },
  investimentos: { name: "Investimentos", icon: TrendingUp },
  receitas: { name: "Receitas", icon: BarChart4 },
  outros: { name: "Outros", icon: MoreHorizontal },
};

export const defaultCategories: CategoryConfig[] = [
  // 🏠 Moradia
  { id: "aluguel_condominio", name: "Aluguel / Condomínio", icon: Home, group: "moradia", color: "#3B82F6", nature: "Fixo" },
  { id: "energia_eletrica", name: "Energia Elétrica", icon: Zap, group: "moradia", color: "#EAB308", nature: "Fixo" },
  { id: "agua_saneamento", name: "Água / Saneamento", icon: Droplets, group: "moradia", color: "#0EA5E9", nature: "Fixo" },
  { id: "internet_tv_tel", name: "Internet / TV / Telefone", icon: Globe, group: "moradia", color: "#6366F1", nature: "Fixo" },
  { id: "manutencao_casa", name: "Manutenção da Casa", icon: Wrench, group: "moradia", color: "#64748B", nature: "Variável" },

  // 🍔 Alimentação
  { id: "supermercado", name: "Supermercado", icon: ShoppingCart, group: "alimentacao", color: "#10B981", nature: "Variável" },
  { id: "restaurantes_ifood", name: "Restaurantes / iFood", icon: Utensils, group: "alimentacao", color: "#F59E0B", nature: "Variável" },
  { id: "cafe_lanches", name: "Café / Lanches", icon: Coffee, group: "alimentacao", color: "#8B5CF6", nature: "Variável" },

  // 🚗 Transporte
  { id: "combustivel", name: "Combustível", icon: Fuel, group: "transporte", color: "#EF4444", nature: "Variável" },
  { id: "uber_apps", name: "Uber / Apps", icon: Car, group: "transporte", color: "#111827", nature: "Variável" },
  { id: "transporte_publico", name: "Transporte Público", icon: Bus, group: "transporte", color: "#3B82F6", nature: "Variável" },
  { id: "manutencao_veicular", name: "Manutenção Veicular", icon: Hammer, group: "transporte", color: "#64748B", nature: "Variável" },

  // ❤️ Saúde
  { id: "farmacia", name: "Farmácia", icon: Pill, group: "saude", color: "#EC4899", nature: "Variável" },
  { id: "plano_saude", name: "Plano de Saúde", icon: Stethoscope, group: "saude", color: "#EF4444", nature: "Fixo" },
  { id: "academia", name: "Academia", icon: Dumbbell, group: "saude", color: "#111827", nature: "Fixo" },

  // 🎡 Lazer
  { id: "viagens", name: "Viagens", icon: Plane, group: "lazer", color: "#3B82F6", nature: "Variável" },
  { id: "cinema_shows", name: "Cinema / Shows", icon: Ticket, group: "lazer", color: "#8B5CF6", nature: "Variável" },
  { id: "assinaturas_lazer", name: "Assinaturas", icon: Play, group: "lazer", color: "#EF4444", nature: "Fixo", allowSubscription: true },

  // 📚 Educação
  { id: "educacao_geral", name: "Educação", icon: GraduationCap, group: "educacao", color: "#10B981", nature: "Fixo" },

  // 🏦 Serviços Financeiros
  { id: "tarifas_bancarias", name: "Tarifas Bancárias", icon: Banknote, group: "servicos_financeiros", color: "#64748B", nature: "Financeiro" },
  { id: "impostos_geral", name: "Impostos", icon: FileText, group: "servicos_financeiros", color: "#F59E0B", nature: "Financeiro" },

  // 📈 Investimentos
  { id: "investimentos_geral", name: "Investimentos", icon: TrendingUp, group: "investimentos", color: "#10B981", nature: "Investimento" },

  // 💰 Receitas
  { id: "salario", name: "Salário", icon: Briefcase, group: "receitas", color: "#10B981", nature: "Renda" },
  { id: "freelance", name: "Freelance", icon: Laptop, group: "receitas", color: "#3B82F6", nature: "Renda" },
  { id: "investimentos_renda", name: "Investimentos (Renda)", icon: BarChart4, group: "receitas", color: "#F59E0B", nature: "Renda" },
  { id: "outras_receitas", name: "Outras Receitas", icon: PlusCircle, group: "receitas", color: "#64748B", nature: "Renda" },

  // 📦 Outros
  { id: "outros", name: "Outros", icon: MoreHorizontal, group: "outros", color: "#94A3B8", nature: "Variável" },
];

export const getCategoryById = (id: string): CategoryConfig | undefined => {
  return defaultCategories.find(c => c.id === id);
};

export const getCategoriesByGroup = (group: CategoryGroup): CategoryConfig[] => {
  return defaultCategories.filter(c => c.group === group);
};

export const getCategoryIcon = (categoryId: string): LucideIcon => {
  const category = getCategoryById(categoryId);
  return category?.icon || MoreHorizontal;
};

export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || "#94A3B8";
};

export const getGroupedCategories = (): Record<CategoryGroup, CategoryConfig[]> => {
  const grouped: Record<CategoryGroup, CategoryConfig[]> = {
    moradia: [],
    alimentacao: [],
    transporte: [],
    saude: [],
    lazer: [],
    educacao: [],
    servicos_financeiros: [],
    investimentos: [],
    receitas: [],
    outros: [],
  };

  defaultCategories.forEach(category => {
    grouped[category.group].push(category);
  });

  return grouped;
};

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PlusCircle,
  Target,
  BarChart3,
  MoreHorizontal,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  HandCoins,
  X,
  Wallet,
  Tag,
  FileText,
  Settings,
  HelpCircle,
  Shield,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/insights", icon: BarChart3, label: "Visão" },
  { path: "#", icon: PlusCircle, label: "Registrar", isMain: true },
  { path: "/goals", icon: Target, label: "Metas" },
  { path: "#more", icon: MoreHorizontal, label: "Mais", isMore: true },
];

const moreItems = [
  { icon: Wallet, label: "Meus Cartões", path: "/cards", desc: "Gerenciar cartões e faturas" },
  { icon: Tag, label: "Categorias", path: "/categories", desc: "Suas categorias de gastos" },
  { icon: FileText, label: "Exportar PDF", path: "/settings", desc: "Relatórios financeiros" },
  { icon: Settings, label: "Configurações", path: "/settings", desc: "Conta e preferências" },
  { icon: HelpCircle, label: "Ajuda", path: "/help", desc: "Dúvidas e suporte" },
  { icon: FileCheck, label: "Termos de Uso", path: "/terms", desc: "Nossos termos" },
  { icon: Shield, label: "Privacidade", path: "/privacy", desc: "Política de dados" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleMainButtonClick = () => {
    setIsMoreOpen(false);
    setIsSheetOpen(true);
  };

  const handleMoreClick = () => {
    setIsSheetOpen(false);
    setIsMoreOpen(true);
  };

  const handleOptionClick = (path: string) => {
    setIsSheetOpen(false);
    setIsMoreOpen(false);
    navigate(path);
  };

  const closeAll = () => {
    setIsSheetOpen(false);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Bottom Sheet Overlay — Register */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={closeAll}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-large pb-safe-bottom"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted" />
              </div>
              <div className="px-6 pb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">O que deseja registrar?</h2>
                <button onClick={closeAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-3">
                <RegisterOption
                  icon={ArrowUpCircle}
                  label="Registrar gasto"
                  desc="Adicione uma despesa à vista"
                  colorClass="impulse"
                  onClick={() => handleOptionClick("/expenses/add")}
                  large
                />
                <RegisterOption
                  icon={ArrowDownCircle}
                  label="Registrar receita"
                  desc="Adicione uma entrada de dinheiro"
                  colorClass="essential"
                  onClick={() => handleOptionClick("/income/add")}
                  large
                />
                <RegisterOption
                  icon={CreditCard}
                  label="Compra no cartão"
                  desc="Registre uma compra parcelada ou à vista"
                  colorClass="primary"
                  onClick={() => handleOptionClick("/cards")}
                />
                <RegisterOption
                  icon={Wallet}
                  label="Registrar dívida"
                  desc="Parcelamentos e compromissos"
                  onClick={() => handleOptionClick("/debts/add")}
                />
                <RegisterOption
                  icon={HandCoins}
                  label="Valor a receber"
                  desc="Valores que devem para você"
                  onClick={() => handleOptionClick("/receivables/add")}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Overlay — More */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={closeAll}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-large pb-safe-bottom"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted" />
              </div>
              <div className="px-6 pb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Mais opções</h2>
                <button onClick={closeAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-2">
                {moreItems.map((item) => (
                  <motion.button
                    key={item.path + item.label}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionClick(item.path)}
                    className="w-full p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3 text-left hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = !item.isMain && !item.isMore && location.pathname === item.path;
            const Icon = item.icon;

            if (item.isMain) {
              return (
                <button key={item.label} onClick={handleMainButtonClick} className="relative -mt-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full gradient-warm shadow-large"
                  >
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </motion.div>
                </button>
              );
            }

            if (item.isMore) {
              return (
                <button
                  key={item.label}
                  onClick={handleMoreClick}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0.5 h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

// ─── Register Option subcomponent ───────────────────────

interface RegisterOptionProps {
  icon: React.ElementType;
  label: string;
  desc: string;
  colorClass?: string;
  onClick: () => void;
  large?: boolean;
}

const RegisterOption = ({ icon: Icon, label, desc, colorClass, onClick, large }: RegisterOptionProps) => {
  const hasColor = !!colorClass;
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl flex items-center gap-3 text-left transition-colors",
        large && hasColor
          ? `p-4 bg-${colorClass}/10 border-2 border-${colorClass}/30 hover:bg-${colorClass}/15`
          : hasColor
            ? `p-3 bg-${colorClass}/10 border border-${colorClass}/20 hover:bg-${colorClass}/15`
            : "p-3 bg-muted/50 border border-border hover:bg-muted"
      )}
    >
      <div className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        large ? "w-12 h-12" : "w-10 h-10",
        hasColor ? `bg-${colorClass}/20` : "bg-muted"
      )}>
        <Icon className={cn(
          large ? "w-6 h-6" : "w-5 h-5",
          hasColor ? `text-${colorClass}` : "text-muted-foreground"
        )} />
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", large ? "text-lg" : "text-sm")}>{label}</p>
        <p className={cn("text-muted-foreground", large ? "text-sm" : "text-xs")}>{desc}</p>
      </div>
    </motion.button>
  );
};

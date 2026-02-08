import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, History, Settings, ArrowDownCircle, ArrowUpCircle, X, CreditCard, HandCoins, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/history", icon: History, label: "Histórico" },
  { path: "#", icon: PlusCircle, label: "Registrar", isMain: true },
  { path: "/goals", icon: Target, label: "Metas" },
  { path: "/settings", icon: Settings, label: "Config" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleMainButtonClick = () => {
    setIsSheetOpen(true);
  };

  const handleOptionClick = (path: string) => {
    setIsSheetOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsSheetOpen(false)}
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-large pb-safe-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">O que deseja registrar?</h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Options */}
              <div className="px-6 pb-6 space-y-3">
                {/* Expense Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick("/expenses/add")}
                  className="w-full p-4 rounded-xl bg-impulse/10 border-2 border-impulse/30 flex items-center gap-4 text-left hover:bg-impulse/15 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-impulse/20 flex items-center justify-center">
                    <ArrowUpCircle className="w-6 h-6 text-impulse" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Registrar gasto</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma despesa manualmente
                    </p>
                  </div>
                </motion.button>

                {/* Income Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick("/income/add")}
                  className="w-full p-4 rounded-xl bg-essential/10 border-2 border-essential/30 flex items-center gap-4 text-left hover:bg-essential/15 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-essential/20 flex items-center justify-center">
                    <ArrowDownCircle className="w-6 h-6 text-essential" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Registrar receita</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma entrada de dinheiro
                    </p>
                  </div>
                </motion.button>

                {/* Debt Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick("/debts/add")}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Registrar dívida</p>
                    <p className="text-xs text-muted-foreground">
                      Parcelamentos e compromissos
                    </p>
                  </div>
                </motion.button>

                {/* Receivable Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick("/receivables/add")}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <HandCoins className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Registrar valor a receber</p>
                    <p className="text-xs text-muted-foreground">
                      Valores que devem para você
                    </p>
                  </div>
                </motion.button>

                {/* Credit Cards Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick("/cards")}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3 text-left hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Meus Cartões</p>
                    <p className="text-xs text-muted-foreground">
                      Gerenciar cartões e faturas
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isMain) {
              return (
                <button
                  key={item.label}
                  onClick={handleMainButtonClick}
                  className="relative -mt-6"
                >
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

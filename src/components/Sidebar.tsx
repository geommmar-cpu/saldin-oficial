// Menu lateral reorganizado do Saldin

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  History,
  Calendar,
  CreditCard,
  HandCoins,
  Tag,
  Target,
  Settings,
  MessageCircle,
  Building2,
  ChevronRight,
  Menu,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoSaldin from "@/assets/logo-saldin-final.png";

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  comingSoon?: boolean;
  highlight?: boolean;
}

const mainNavItems: NavItem[] = [
  { path: "/", icon: Home, label: "Home (Saldo)" },
  { path: "/history", icon: History, label: "Movimentações" },
  { path: "/banks", icon: Building2, label: "Contas Bancárias" },
  { path: "/goals", icon: Target, label: "Metas", highlight: true },
  { path: "/overview", icon: Calendar, label: "Parcelas Futuras" },
  { path: "/debts", icon: CreditCard, label: "Dívidas" },
  { path: "/receivables", icon: HandCoins, label: "Valores a Receber" },
  { path: "/categories", icon: Tag, label: "Categorias" },
];

const secondaryNavItems: NavItem[] = [
  { path: "/settings", icon: Settings, label: "Configurações" },
];

const comingSoonItems: NavItem[] = [
  { path: "#", icon: MessageCircle, label: "WhatsApp", comingSoon: true },
  { path: "#", icon: Building2, label: "Conectar Bancos", comingSoon: true },
];
 
 export const Sidebar = () => {
   const [isOpen, setIsOpen] = useState(false);
   const location = useLocation();
   const navigate = useNavigate();
 
   const handleNavClick = (item: NavItem) => {
     if (item.comingSoon) {
       return;
     }
     navigate(item.path);
     setIsOpen(false);
   };
 
   return (
     <>
       {/* Mobile trigger button */}
       <Button
         variant="ghost"
         size="icon"
         className="fixed top-4 left-4 z-50 md:hidden"
         onClick={() => setIsOpen(true)}
       >
         <Menu className="w-5 h-5" />
       </Button>
 
       {/* Overlay */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/50 z-50 md:hidden"
             onClick={() => setIsOpen(false)}
           />
         )}
       </AnimatePresence>
 
       {/* Sidebar */}
       <AnimatePresence>
         {(isOpen || typeof window !== "undefined" && window.innerWidth >= 768) && (
           <motion.aside
             initial={{ x: -280 }}
             animate={{ x: 0 }}
             exit={{ x: -280 }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className={cn(
               "fixed left-0 top-0 h-full w-[280px] bg-sidebar-background border-r border-sidebar-border z-50",
               "flex flex-col",
               "md:relative md:translate-x-0"
             )}
           >
             {/* Header */}
             <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
               <img src={logoSaldin} alt="Saldin" className="h-12 object-contain" />
               <Button
                 variant="ghost"
                 size="icon"
                 className="md:hidden"
                 onClick={() => setIsOpen(false)}
               >
                 <X className="w-5 h-5" />
               </Button>
             </div>
 
             {/* Main Navigation */}
             <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                 Principal
               </p>
               {mainNavItems.map((item) => {
                 const isActive = location.pathname === item.path;
                 const Icon = item.icon;
                 
                 return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : item.highlight
                          ? "text-essential hover:bg-essential/10"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", item.highlight && !isActive && "text-essential")} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-essential/10 text-essential font-medium">
                          Novo
                        </span>
                      )}
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                 );
               })}
 
               <div className="pt-4">
                 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                   Outros
                 </p>
                 {secondaryNavItems.map((item) => {
                   const isActive = location.pathname === item.path;
                   const Icon = item.icon;
                   
                   return (
                     <button
                       key={item.path}
                       onClick={() => handleNavClick(item)}
                       className={cn(
                         "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                         isActive
                           ? "bg-sidebar-accent text-sidebar-accent-foreground"
                           : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                       )}
                     >
                       <Icon className="w-5 h-5" />
                       <span className="flex-1 text-left">{item.label}</span>
                     </button>
                   );
                 })}
               </div>
 
               {/* Coming Soon Section */}
               <div className="pt-4">
                 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                   Em breve
                 </p>
                 {comingSoonItems.map((item) => {
                   const Icon = item.icon;
                   
                   return (
                     <div
                       key={item.label}
                       className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/60 cursor-not-allowed"
                     >
                       <Icon className="w-5 h-5" />
                       <span className="flex-1 text-left">{item.label}</span>
                       <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                         <Clock className="w-2.5 h-2.5" />
                         Em breve
                       </span>
                     </div>
                   );
                 })}
               </div>
             </nav>
 
             {/* Footer */}
             <div className="p-4 border-t border-sidebar-border">
               <p className="text-xs text-muted-foreground text-center">
                 Saldin © 2025
               </p>
             </div>
           </motion.aside>
         )}
       </AnimatePresence>
     </>
   );
 };
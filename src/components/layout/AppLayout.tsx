import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    History,
    CreditCard,
    Wallet,
    Shuffle,
    Target,
    Settings,
    HelpCircle,
    LogOut,
    Menu,
    X,
    User,
    Bell,
    Calendar,
    BarChart4,
    Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logoSaldin from "@/assets/logo-saldin-final.png";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { FloatingActionMenu } from "@/components/layout/FloatingActionMenu";
import { motion } from "framer-motion";

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string; // Allow passing className to main content
}

const navItems = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Cartões", icon: CreditCard, path: "/cards" },
    { label: "Contas", icon: Wallet, path: "/banks" },
    { label: "Carteira Cripto", icon: Bitcoin, path: "/crypto-wallet" },
    { label: "Assinaturas", icon: Calendar, path: "/subscriptions" },
    { label: "Metas", icon: Target, path: "/goals" },
    { label: "Relatórios e Análise", icon: BarChart4, path: "/reports" },
    { label: "Recebíveis", icon: Shuffle, path: "/receivables" },
    { label: "Histórico", icon: History, path: "/history" },
];

const secondaryNavItems = [
    { label: "Configurações", icon: Settings, path: "/settings" },
    { label: "Ajuda", icon: HelpCircle, path: "/help" },
];

export const AppLayout = ({ children, className }: AppLayoutProps) => {
    const location = useLocation();
    const { signOut, user } = useAuth();
    const { data: profile } = useProfile();
    const [open, setOpen] = useState(false);

    // Swipe gesture logic
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Apenas considera o primeiro toque
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartX.current;
        const diffY = touch.clientY - touchStartY.current;

        // Lógica para abrir o menu:
        // 1. O toque começou na borda esquerda (< 40px da tela)
        // 2. O movimento é positivo (para a direita)
        // 3. A distância horizontal é maior que a vertical (swipe horizontal)
        // 4. A distância é maior que 50px (evita toques acidentais)
        if (touchStartX.current < 40 && diffX > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            setOpen(true);
            // Reseta para não disparar novamente no mesmo toque
            touchStartX.current = null;
            touchStartY.current = null;
        }
    };

    const handleTouchEnd = () => {
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full py-4">
            {/* Logo */}
            <div className="px-6 mb-2 mt-4 flex justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-40 scale-150 -z-10" />
                    <motion.img
                        src={logoSaldin}
                        alt="Saldin"
                        className="h-24 object-contain drop-shadow-md"
                        animate={{
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>

            {/* User Info (Optional - consistent with sidebar design) */}
            <div className="px-6 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">
                                {profile?.full_name
                                    ? profile.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                    : <User className="w-5 h-5" />}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{profile?.full_name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                    </div>
                </div>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Menu Principal
                </p>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            onClick={() => setOpen(false)}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="pt-6 pb-2">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Sistema
                    </p>
                    {secondaryNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                onClick={() => setOpen(false)}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Botão Sair - Agora parte do fluxo normal, não fixo no rodapé para evitar sumir */}
                    <button
                        onClick={() => {
                            setOpen(false);
                            signOut();
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </nav>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-background flex"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden lg:block w-64 border-r border-border bg-card fixed h-full z-30">
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative w-full overflow-hidden">
                {/* Mobile Header (Sidebar Trigger) */}
                <header className="lg:hidden px-4 pt-safe-top sticky top-0 bg-background/80 backdrop-blur-xl z-20 grid grid-cols-3 items-center h-16 border-b border-border/50 transition-all shadow-sm">
                    {/* Left: Menu Trigger */}
                    <div className="flex justify-start">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 hover:bg-primary/10 transition-colors">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-[280px]">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Center: Logo (Bigger & Highlighted) */}
                    <div className="flex justify-center -ml-1"> {/* Negative margin to offset visual center if needed */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 scale-150 -z-10" />
                            <motion.img
                                src={logoSaldin}
                                alt="Saldin"
                                className="h-14 object-contain drop-shadow-sm"
                                animate={{
                                    scale: [1, 1.02, 1],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Notifications */}
                    <div className="flex justify-end">
                        <Link to="/alerts">
                            <Button variant="ghost" size="icon" className="relative -mr-2 hover:bg-primary/10 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full" />
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className={cn("flex-1 w-full overflow-x-hidden", className)}>
                    {children}
                </main>

                {/* Floating Action Button - Available on all AppLayout pages */}
                <FloatingActionMenu />
            </div>
        </div>
    );
};

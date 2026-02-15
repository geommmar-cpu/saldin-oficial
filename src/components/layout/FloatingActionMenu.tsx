import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, CreditCard, Target, Wallet, X, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
    {
        label: "Despesa",
        icon: TrendingDown,
        path: "/expenses/add",
        color: "bg-impulse text-white hover:bg-impulse/90",
        delay: 0.1
    },
    {
        label: "Receita",
        icon: TrendingUp,
        path: "/income/add",
        color: "bg-essential text-white hover:bg-essential/90",
        delay: 0.05
    },
    {
        label: "Transferência",
        icon: ArrowLeftRight,
        path: "/banks/transfer",
        color: "bg-blue-500 text-white hover:bg-blue-600",
        delay: 0.15
    },
    {
        label: "Nova Meta",
        icon: Target,
        path: "/goals/add",
        color: "bg-emerald-500 text-white hover:bg-emerald-600",
        delay: 0.2
    },
];

export const FloatingActionMenu = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleAction = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <div className="flex flex-col gap-3 items-end z-50 mb-2">
                            {actions.map((action) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{ duration: 0.2, delay: action.delay }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-sm font-medium bg-card px-2 py-1 rounded-md shadow-sm border border-border/50">
                                        {action.label}
                                    </span>
                                    <Button
                                        size="icon"
                                        className={cn("h-12 w-12 rounded-full shadow-lg", action.color)}
                                        onClick={() => handleAction(action.path)}
                                    >
                                        <action.icon className="h-6 w-6" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>

            <motion.button
                className="relative z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={toggleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus className="h-8 w-8" />
                </motion.div>
            </motion.button>
        </div>
    );
};

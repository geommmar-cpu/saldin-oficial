import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
    Shield, Zap, CreditCard, Target, MessageCircle, Clock,
    CheckCircle, ArrowRight, ChevronDown, Star, TrendingUp,
    AlertTriangle, Eye, EyeOff, DollarSign, Users, Lock,
    Smartphone, BarChart3, Wallet, Bomb, Send, X, Menu,
    ChevronUp, Sparkles, Check, Play
} from "lucide-react";
import logoSaldin from "@/assets/logo-saldin-final.png";

// ─── Animated section wrapper ───
const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.section
            ref={ref}
            id={id}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.section>
    );
};

// ─── Phone Mockup Component ───
const PhoneMockup = () => {
    const [messages, setMessages] = useState<{ type: 'user' | 'bot', text: string | React.ReactNode }[]>([]);

    useEffect(() => {
        const sequence = [
            { type: 'user', text: 'Gastei 150 no mercado', delay: 1000 },
            { type: 'bot', text: '✅ Anotado! Categoria: Mercado.', delay: 2000 },
            {
                type: 'bot', text: (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs opacity-70">Saldo Livre Atualizado:</span>
                        <span className="text-lg font-bold">R$ 1.450,00</span>
                        <div className="w-full bg-black/10 rounded-full h-1 mt-1">
                            <div className="bg-white h-1 rounded-full w-[70%]" />
                        </div>
                    </div>
                ), delay: 3500
            },
        ];

        let timeouts: NodeJS.Timeout[] = [];

        const runSequence = () => {
            setMessages([]);
            let currentTime = 0;
            sequence.forEach(({ type, text, delay }) => {
                currentTime += delay;
                timeouts.push(setTimeout(() => {
                    setMessages(prev => [...prev, { type: type as 'user' | 'bot', text }]);
                }, currentTime));
            });

            // Loop sequence
            timeouts.push(setTimeout(runSequence, currentTime + 5000));
        };

        runSequence();

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[500px] w-[280px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#0b141a] relative flex flex-col">
                {/* Header */}
                <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3 shadow-sm z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                        S
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold">Saldin</p>
                        <p className="text-emerald-400 text-[10px]">Online</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[url('https://camo.githubusercontent.com/c50ae4df9e6141a4a4023b08e54737782da2685714081c7f9996b79417852a3b/68747470733a2f2f7765622e77686174736170702e636f6d2f696d672f62672d636861742d74696c652d6461726b5f61346265353132653731393562366237333364393131306234303866303735642e706e67')] bg-repeat opacity-90">
                    <p className="text-center text-[10px] text-gray-400 my-2 bg-[#1f2c34] inline-block px-2 py-1 rounded-lg mx-auto w-fit">Hoje</p>

                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-lg p-2 text-sm text-white shadow-sm ${msg.type === 'user' ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#1f2c34] rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                    <div className={`text-[9px] text-right mt-1 ${msg.type === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        {msg.type === 'user' && <span className="ml-1 text-blue-300">✓✓</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-600/50"></div>
                    <div className="flex-1 h-8 bg-[#2a3942] rounded-full"></div>
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
                        <Send className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Calculation Demo Component ───
const CalculationDemo = () => {
    const [income, setIncome] = useState(5000);
    const [fixed, setFixed] = useState(2000);
    const [installments, setInstallments] = useState(800);

    // Auto-animate values on mount for visual effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setIncome(5500);
            setFixed(2100);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const trueBalance = income - fixed - installments;
    const percent = Math.max(0, Math.min(100, (trueBalance / income) * 100));

    return (
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-6 text-center">Descubra seu Saldo Livre</h3>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-muted-foreground">Renda Líquida</label>
                        <span className="font-semibold">R$ {income.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={2000} max={10000} step={100}
                        value={income} onChange={(e) => setIncome(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-muted-foreground flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-impulse/80" /> Contas Fixas</label>
                        <span className="font-semibold text-impulse">R$ {fixed.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={500} max={4000} step={50}
                        value={fixed} onChange={(e) => setFixed(Number(e.target.value))}
                        className="w-full accent-impulse h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-muted-foreground flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-obligation" /> Parcelas Futuras</label>
                        <span className="font-semibold text-obligation">R$ {installments.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min={0} max={3000} step={50}
                        value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full accent-obligation h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center mb-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saldo Livre de Verdade™</p>
                </div>
                <div className="flex justify-center items-center gap-2 mb-2">
                    <motion.span
                        key={trueBalance}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300"
                    >
                        R$ {trueBalance.toLocaleString()}
                    </motion.span>
                </div>
                <div className="flex justify-center">
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                        <motion.div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />
                    </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-3">
                    Isso é o que REALMENTE sobra. Sem sustos.
                </p>
            </div>
        </div>
    );
};

// ─── Headlines rotation ───
const headlines = [
    "Você não está sem dinheiro.\nVocê está sem visão.",
    "Parcelas invisíveis\ncomem seu salário.",
    "Saiba exatamente\nquanto pode gastar.",
];

// ─── Testimonials ───
const testimonials = [
    { name: "Camila R.", role: "32, Professora", text: "Eu achava que estava bem porque via R$ 2.000 no banco. O Saldin me mostrou que R$ 1.700 já eram de parcelas. Foi um choque necessário.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    { name: "Lucas M.", role: "28, Designer", text: "Renda variável sempre foi caótico. Agora eu sei exatamente quanto posso gastar antes de comprometer o mês. É como ter um consultor no bolso.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    { name: "Ana Paula S.", role: "41, Médica", text: "Planilha eu largava no 3º dia. O Saldin eu uso pelo WhatsApp — mando áudio e ele registra. Nunca foi tão fácil ter controle.", avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d" },
    { name: "Roberto F.", role: "35, Engenheiro", text: "O Plano de Guerra das Dívidas me deu a data exata que eu zero tudo. Faltam 7 meses. Pela primeira vez, tenho esperança de verdade.", avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d" },
];

// ─── FAQ ───
const faqs = [
    { q: "Preciso conectar meu banco?", a: "Não! O Saldin acredita na privacidade total. Você não conecta contas bancárias. Tudo é registrado via WhatsApp (áudio, texto, foto) ou manualmente, garantindo que seus dados bancários fiquem protegidos." },
    { q: "Funciona para quem ganha pouco?", a: "Sim! Na verdade, quem tem orçamento mais apertado é quem mais se beneficia da clareza do Saldo Livre para não entrar em dívidas." },
    { q: "É seguro mandar dados no WhatsApp?", a: "Absolutamente. O Saldin usa criptografia de ponta a ponta e processa as mensagens apenas para extrair os dados financeiros. Não pedimos senhas, CPF ou dados sensíveis." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem fidelidade, sem letras miúdas. Você gerencia sua assinatura direto no painel com um clique." },
    { q: "O WhatsApp é um robô ou humano?", a: "É uma Inteligência Artificial avançada, treinada para entender linguagem natural. Você fala como falaria com um amigo e ela entende." },
];

const Landing = () => {
    const navigate = useNavigate();
    const [headlineIndex, setHeadlineIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeadlineIndex((i) => (i + 1) % headlines.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
            {/* ─── NAVBAR ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <img src={logoSaldin} alt="Saldin" className="h-8 md:h-10 w-auto object-contain" />

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <button onClick={() => scrollTo("problema")} className="hover:text-primary transition-colors">O Problema</button>
                        <button onClick={() => scrollTo("funcionalidades")} className="hover:text-primary transition-colors">Funcionalidades</button>
                        <button onClick={() => scrollTo("depoimentos")} className="hover:text-primary transition-colors">Depoimentos</button>
                        <button onClick={() => scrollTo("faq")} className="hover:text-primary transition-colors">FAQ</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="hidden md:inline-flex" onClick={() => navigate("/auth")}>
                            Entrar
                        </Button>
                        <Button onClick={() => navigate("/auth")} className="gradient-warm text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 transition-all duration-300 rounded-full px-6">
                            Começar Agora
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-border bg-background px-4 pb-6 shadow-xl"
                        >
                            <div className="flex flex-col gap-4 pt-4 text-base font-medium">
                                <button onClick={() => scrollTo("problema")} className="text-left py-2 text-muted-foreground border-b border-border/50">O Problema</button>
                                <button onClick={() => scrollTo("funcionalidades")} className="text-left py-2 text-muted-foreground border-b border-border/50">Funcionalidades</button>
                                <button onClick={() => scrollTo("depoimentos")} className="text-left py-2 text-muted-foreground border-b border-border/50">Depoimentos</button>
                                <button onClick={() => scrollTo("faq")} className="text-left py-2 text-muted-foreground border-b border-border/50">FAQ</button>
                                <button onClick={() => navigate("/auth")} className="text-left py-2 text-primary font-bold">Entrar na minha conta</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ─── HERO SECTION ─── */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 relative overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-semibold mb-8 border border-orange-200 dark:border-orange-800">
                            <Sparkles className="w-4 h-4 fill-current" />
                            A revolução no controle financeiro
                        </div>

                        <div className="h-[140px] md:h-[180px] lg:h-[200px] relative mb-6">
                            <AnimatePresence mode="wait">
                                <motion.h1
                                    key={headlineIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight absolute top-0 left-0 w-full"
                                >
                                    {headlines[headlineIndex]}
                                </motion.h1>
                            </AnimatePresence>
                        </div>

                        <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                            O Saldin mostra seu <strong className="text-foreground font-semibold">Saldo Livre de Verdade™</strong>.
                            Sem planilhas complexas. Basta enviar um áudio ou foto no WhatsApp.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="gradient-warm text-white border-0 h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
                            >
                                Testar Grátis Agora
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => scrollTo("mecanismo")}
                                className="h-14 px-8 text-lg rounded-full border-2 bg-transparent hover:bg-secondary/50"
                            >
                                <Play className="w-4 h-4 ml-2 mr-2 fill-current" />
                                Ver como funciona
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-500" /> Dados Criptografados</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sem Cartão</span>
                        </div>
                    </motion.div>

                    {/* Right: Phone Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex justify-center lg:justify-end relative"
                    >
                        {/* Decorative circles behind phone */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 to-pink-500/20 rounded-full blur-3xl transform scale-90" />
                        <PhoneMockup />
                    </motion.div>
                </div>
            </section>

            {/* ─── LOGOS SECTION ─── */}
            <div className="border-y border-border/40 bg-gray-50/50 dark:bg-white/[0.02] py-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">A ferramenta ideal para sua liberdade</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Fake logos for style - replaced with text for now as no assets */}
                        <span className="text-xl font-bold font-serif">Freelancers</span>
                        <span className="text-xl font-bold font-serif">Autônomos</span>
                        <span className="text-xl font-bold font-serif">Estudantes</span>
                        <span className="text-xl font-bold font-serif">Trabalhadores CLT</span>
                        <span className="text-xl font-bold font-serif">Pequenos Negócios</span>
                    </div>
                </div>
            </div>

            {/* ─── PROBLEM SECTION ─── */}
            <Section id="problema" className="py-24 px-4 bg-white dark:bg-black/20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-bold uppercase tracking-widest text-impulse">O Inimigo Invisível</span>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">
                            Por que você sente que o dinheiro some?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            O app do banco foi feito para você gastar. O Saldin foi feito para você prosperar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: EyeOff,
                                title: "O Saldo Falso",
                                desc: "O banco mostra R$ 2.000 na conta, mas não avisa que R$ 1.500 já estão comprometidos com contas e cartões.",
                                color: "text-orange-500",
                                bg: "bg-orange-50 dark:bg-orange-950/20"
                            },
                            {
                                icon: Target,
                                title: "Parcelas Fantasmas",
                                desc: "Aquelas comprinhas parceladas 'pequenas' se somam e comem 40% da sua renda antes mesmo do salário cair.",
                                color: "text-red-500",
                                bg: "bg-red-50 dark:bg-red-950/20"
                            },
                            {
                                icon: AlertTriangle,
                                title: " Cegueira Financeira",
                                desc: "Sem clareza, você gasta por impulso. Quando a fatura chega, o susto é inevitável e o ciclo se repete.",
                                color: "text-yellow-500",
                                bg: "bg-yellow-50 dark:bg-yellow-950/20"
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="font-serif text-2xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── SOLUTION / MECHANISM SECTION ─── */}
            <Section id="mecanismo" className="py-24 px-4 bg-muted/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">O Mecanismo Saldin</span>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight">
                            A única métrica que importa: <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Saldo Livre de Verdade™</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            Esqueça gráficos complexos. O Saldin calcula instantaneamente quanto você pode gastar hoje sem comprometer suas contas, parcelas e dívidas futuras.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Conexão direta com a realidade do seu bolso",
                                "Considera parcelas dos próximos meses",
                                "Atualizado em tempo real via WhatsApp",
                                "Previsibilidade total do mês"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="font-medium text-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className="gradient-warm text-white px-8 h-12 rounded-full shadow-lg"
                            onClick={() => navigate("/auth")}
                        >
                            Quero ter essa clareza
                        </Button>
                    </div>

                    <div className="flex justify-center">
                        <CalculationDemo />
                    </div>
                </div>
            </Section>

            {/* ─── FEATURES GRID (BENTO) ─── */}
            <Section id="funcionalidades" className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Funcionalidades Poderosas</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tudo o que você precisa para dominar seu dinheiro, sem chatice.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Feature 1: WhatsApp (Large) */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 row-span-1 rounded-3xl bg-gray-900 text-white p-8 relative overflow-hidden flex flex-col justify-between group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/30 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">WhatsApp Inteligente</h3>
                                <p className="text-gray-300 max-w-md">Envie áudio, foto de notas fiscais ou texto. Nossa IA processa, categoriza e atualiza seu saldo em segundos.</p>
                            </div>
                            <img src="https://illustrations.popsy.co/amber/working-vacation.svg" className="absolute -bottom-4 -right-4 w-48 opacity-20 rotate-12" alt="WhatsApp" />
                        </motion.div>

                        {/* Feature 2: Cards */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="rounded-3xl bg-white dark:bg-card border border-border p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
                        >
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Gestão de Cartões</h3>
                                <p className="text-muted-foreground text-sm">Controle seus limites e veja o impacto das parcelas no futuro.</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                        </motion.div>

                        {/* Feature 3: Debt War Plan */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="rounded-3xl bg-white dark:bg-card border border-border p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
                                <Bomb className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Plano de Guerra</h3>
                                <p className="text-muted-foreground text-sm">Estratégias matemáticas para acabar com as dívidas o mais rápido possível.</p>
                            </div>
                        </motion.div>

                        {/* Feature 4: Receivables (Large) */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 rounded-3xl bg-orange-50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 p-8 flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 w-full">
                                <div className="w-12 h-12 bg-orange-200 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center mb-4">
                                    <Send className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Cobrança de Recebíveis</h3>
                                <p className="text-muted-foreground max-w-lg">Quem te deve? Organize e envie cobranças amigáveis e profissionais direto pelo WhatsApp com um clique.</p>
                            </div>
                            <div className="absolute bottom-6 right-6 flex -space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs text-white">JD</div>
                                <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs text-white">AM</div>
                                <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-xs text-white">LP</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Section>

            {/* ─── TESTIMONIALS ─── */}
            <Section id="depoimentos" className="py-24 px-4 bg-muted/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Vidas transformadas</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 flex flex-col"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-sm">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="inline-block w-3.5 h-3.5 fill-orange-400 text-orange-400 mr-0.5" />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── WAITING LIST / PRICING ─── */}
            {/* Keeping Pricing from original but styling improvements */}
            <Section id="pricing" className="py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Oferta de Lançamento</span>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">Comece agora com 5 dias grátis</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Sem letras miúdas. Se não gostar, cancele com um clique.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-center">
                        {/* Monthly */}
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold mb-2">Mensal</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold">R$ 19,90</span>
                                <span className="text-muted-foreground">/mês</span>
                            </div>
                            <Button variant="outline" className="w-full rounded-full mb-6" onClick={() => navigate("/auth")}>Escolher Mensal</Button>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Acesso total</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> WhatsApp Ilimitado</li>
                            </ul>
                        </div>

                        {/* Semester - Highlighted */}
                        <div className="relative p-8 rounded-3xl bg-gray-900 text-white shadow-xl scale-105 border border-gray-800">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wide">
                                Recomendado
                            </div>
                            <h3 className="text-xl font-bold mb-2">Semestral</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-bold">R$ 14,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">Cobrado R$ 89,90 a cada 6 meses</p>

                            <Button className="w-full rounded-full gradient-warm border-0 font-bold h-12 mb-8" onClick={() => navigate("/auth")}>
                                Testar Grátis Agora
                            </Button>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tudo do Mensal</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> 25% de Desconto</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400" /> Prioridade no Suporte</li>
                            </ul>
                        </div>

                        {/* Annual */}
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-bold mb-2">Anual</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold">R$ 12,49</span>
                                <span className="text-muted-foreground">/mês</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-6">Cobrado R$ 149,90 por ano</p>
                            <Button variant="outline" className="w-full rounded-full mb-6" onClick={() => navigate("/auth")}>Escolher Anual</Button>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Maior economia (37%)</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> Acesso Beta a novidades</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── FAQ ─── */}
            <Section id="faq" className="py-24 px-4 bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-6 text-left font-medium"
                                >
                                    {faq.q}
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 pt-0 text-muted-foreground text-sm leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─── FINAL CTA ─── */}
            <section className="py-32 px-4 relative overflow-hidden bg-gray-900 text-white">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-primary/20" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Do caos à clareza em 1 minuto.
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Pare de adiar sua paz financeira. O primeiro passo é o único que depende de você.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/auth")}
                            className="h-16 px-10 rounded-full text-lg font-bold bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all"
                        >
                            Começar 5 Dias Grátis
                        </Button>
                    </div>
                    <p className="text-gray-500 text-xs mt-6">Não pedimos cartão de crédito • Cancelamento fácil</p>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border py-12 px-4 bg-background">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src={logoSaldin} alt="Saldin" className="h-6 grayscale opacity-80" />
                        <span className="text-sm text-muted-foreground">© 2025 Saldin</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
                        <a href="#" className="hover:text-foreground transition-colors">Termos</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-foreground transition-colors">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

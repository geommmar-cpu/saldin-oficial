import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { generateFinancialReport } from "@/lib/exportPdf";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { useDebts } from "@/hooks/useDebts";
import { useReceivables } from "@/hooks/useReceivables";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { useGoals, useGoalStats } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  User,
  Mail,
  Crown,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Zap,
  TrendingUp,
  FileText,
  History,
  CreditCard,
  HelpCircle,
  FileQuestion,
  Shield,
  LogOut,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  Fingerprint,
  Trash2,
  Bitcoin
} from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { 
    isSupported: isBiometricSupported, 
    isEnabled: isBiometricEnabled,
    registerBiometric,
    removeAllCredentials,
    getCredentialsForUser,
    isLoading: isBiometricLoading,
  } = useWebAuthn();

  const { data: allExpenses } = useExpenses("confirmed");
  const { data: allIncomes } = useIncomes();
  const { data: allDebts } = useDebts("active");
  const { data: allReceivables } = useReceivables("pending");
  const { data: allGoals } = useGoals("all");
  const { data: goalStats } = useGoalStats();
  const { data: ccInstallments = [] } = useCardInstallmentsByMonth(new Date());
  
  // Keep localStorage in sync with DB value
  useEffect(() => {
    if (profile?.ai_name && profile.ai_name !== preferences.aiName) {
      updatePreference("aiName", profile.ai_name);
    }
  }, [profile?.ai_name]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [biometricActivating, setBiometricActivating] = useState(false);
  
  // Mock WhatsApp status
  const whatsappStatus = {
    connected: true,
    number: "+55 11 99999-9999",
  };

  // Alert preferences (local state for demo)
  const [impulseAlerts, setImpulseAlerts] = useState(true);
  const [highSpendAlerts, setHighSpendAlerts] = useState(true);

  // Get user's biometric credentials
  const userCredentials = user?.id ? getCredentialsForUser(user.id) : [];
  const hasBiometricEnabled = userCredentials.length > 0;

  const openWhatsApp = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear all React Query cache
      queryClient.clear();
      // Reset local preferences but preserve dark mode
      const currentDarkMode = preferences.darkMode;
      resetPreferences();
      // Restore dark mode preference
      if (currentDarkMode) {
        const stored = localStorage.getItem("user_preferences");
        const prefs = stored ? JSON.parse(stored) : {};
        prefs.darkMode = true;
        localStorage.setItem("user_preferences", JSON.stringify(prefs));
        document.documentElement.classList.add("dark");
      }
      // Sign out from Supabase
      await signOut();
      // Navigate to auth
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!user?.id || !user?.email) return;
    
    if (hasBiometricEnabled) {
      // Remove biometric
      removeAllCredentials(user.id);
      toast({
        title: "Biometria desativada",
        description: "Você precisará usar email e senha para entrar.",
      });
    } else {
      // Enable biometric
      setBiometricActivating(true);
      const success = await registerBiometric(user.id, user.email);
      setBiometricActivating(false);
      
      if (success) {
        toast({
          title: "Biometria ativada!",
          description: "Na próxima vez, use sua biometria para entrar.",
        });
      } else {
        toast({
          title: "Erro ao ativar",
          description: "Não foi possível ativar a biometria.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportPdf = async () => {
    try {
      toast({ title: "Gerando relatório..." });
      await generateFinancialReport({
        incomes: allIncomes || [],
        expenses: allExpenses || [],
        debts: allDebts || [],
        receivables: allReceivables || [],
        goals: allGoals || [],
        creditCardInstallments: ccInstallments as any,
        userName: user?.user_metadata?.full_name || profile?.full_name,
        selectedMonth: new Date(),
        goalsSaved: goalStats?.totalSaved || 0,
      });
      toast({ title: "PDF gerado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Configurações</h1>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Bloco 1 - Conta */}
        <FadeIn>
          <SettingsSection title="Conta">
            <SettingsItem
              icon={User}
              label="Nome"
              value={profile?.full_name || user?.user_metadata?.full_name || "Usuário"}
            />
            <SettingsItem
              icon={Mail}
              label="Email"
              value={user?.email || "—"}
            />
            <SettingsItem
              icon={Crown}
              label="Plano atual"
              value="Grátis"
              badge="Upgrade"
              onClick={() => {}}
            />
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => navigate("/account/edit")}
              >
                <Edit2 className="w-4 h-4" />
                Editar conta
              </Button>
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco 2 - Assistente WhatsApp */}
        <FadeIn delay={0.05}>
          <SettingsSection title="Assistente WhatsApp">
            <SettingsItem
              icon={MessageCircle}
              label="Assistente"
              value="Saldin"
            />
            <SettingsItem
              icon={Smartphone}
              label="Número conectado"
              value={whatsappStatus.number}
            />
            <SettingsItem
              icon={whatsappStatus.connected ? CheckCircle2 : XCircle}
              iconColor={whatsappStatus.connected ? "text-essential" : "text-impulse"}
              label="Status"
              value={whatsappStatus.connected ? "Conectado" : "Desconectado"}
              valueColor={whatsappStatus.connected ? "text-essential" : "text-impulse"}
            />
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={openWhatsApp}
              >
                <RefreshCw className="w-4 h-4" />
                Reconectar
              </Button>
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco 3 - Segurança */}
        <FadeIn delay={0.1}>
          <SettingsSection title="Segurança">
            {isBiometricSupported && (
              <SettingsItem
                icon={Fingerprint}
                iconColor={hasBiometricEnabled ? "text-essential" : "text-muted-foreground"}
                label="Login por biometria"
                description={hasBiometricEnabled 
                  ? `Ativado • ${userCredentials[0]?.deviceName || "Dispositivo"}`
                  : "Use impressão digital ou Face ID"
                }
                action={
                  <Switch
                    checked={hasBiometricEnabled}
                    disabled={biometricActivating || isBiometricLoading}
                    onCheckedChange={handleToggleBiometric}
                  />
                }
              />
            )}
            {!isBiometricSupported && (
              <SettingsItem
                icon={Fingerprint}
                iconColor="text-muted-foreground"
                label="Login por biometria"
                description="Seu dispositivo não suporta biometria"
              />
            )}
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Aparência */}
        <FadeIn delay={0.12}>
          <SettingsSection title="Aparência">
            <SettingsItem
              icon={preferences.darkMode ? Moon : Sun}
              iconColor={preferences.darkMode ? "text-primary" : "text-amber-500"}
              label="Modo escuro"
              description="Alterna entre tema claro e escuro"
              action={
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => updatePreference("darkMode", checked)}
                />
              }
            />
          </SettingsSection>
        </FadeIn>

        {/* Funcionalidades Extras */}
        <FadeIn delay={0.13}>
          <SettingsSection title="Funcionalidades extras">
            <SettingsItem
              icon={Bitcoin}
              iconColor={preferences.cryptoEnabled ? "text-[#F7931A]" : "text-muted-foreground"}
              label="Carteira de criptomoedas"
              description="Controle patrimonial de cripto"
              action={
                <Switch
                  checked={preferences.cryptoEnabled}
                  onCheckedChange={(checked) => updatePreference("cryptoEnabled", checked)}
                />
              }
            />
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Alertas */}
        <FadeIn delay={0.15}>
          <SettingsSection title="Alertas">
            <SettingsItem
              icon={Zap}
              iconColor="text-impulse"
              label="Alertas de impulso"
              description="Avisa quando gasto por impulso aumenta"
              action={
                <Switch
                  checked={impulseAlerts}
                  onCheckedChange={setImpulseAlerts}
                />
              }
            />
            <SettingsItem
              icon={TrendingUp}
              iconColor="text-accent"
              label="Alerta de gasto elevado"
              description="Avisa quando comprometer mais de 80% da renda"
              action={
                <Switch
                  checked={highSpendAlerts}
                  onCheckedChange={setHighSpendAlerts}
                />
              }
            />
            <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
              Alertas críticos não podem ser desativados
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Dados e Relatórios */}
        <FadeIn delay={0.15}>
          <SettingsSection title="Dados e Relatórios">
            <SettingsItem
              icon={FileText}
              label="Exportar PDF"
              description="Relatório completo do mês"
              onClick={handleExportPdf}
              showArrow
            />
            <SettingsItem
              icon={History}
              label="Histórico completo"
              onClick={() => navigate("/history")}
              showArrow
            />
          </SettingsSection>
        </FadeIn>

        {/* Bloco 5 - Integrações */}
        <FadeIn delay={0.2}>
          <SettingsSection title="Integrações">
            <SettingsItem
              icon={MessageCircle}
              iconColor="text-[#25D366]"
              label="WhatsApp"
              value={whatsappStatus.connected ? "Conectado" : "Desconectado"}
              valueColor={whatsappStatus.connected ? "text-essential" : "text-impulse"}
              onClick={openWhatsApp}
              showArrow
            />
          </SettingsSection>
        </FadeIn>

        {/* Bloco 6 - Suporte e Legal */}
        <FadeIn delay={0.25}>
          <SettingsSection title="Suporte e Legal">
            <SettingsItem
              icon={HelpCircle}
              label="Ajuda"
              onClick={() => navigate("/help")}
              showArrow
            />
            <SettingsItem
              icon={FileQuestion}
              label="Termos de uso"
              onClick={() => navigate("/terms")}
              showArrow
            />
            <SettingsItem
              icon={Shield}
              label="Política de privacidade"
              onClick={() => navigate("/privacy")}
              showArrow
            />
            <SettingsItem
              icon={LogOut}
              iconColor="text-impulse"
              label={loggingOut ? "Saindo..." : "Sair da conta"}
              labelColor="text-impulse"
              onClick={handleLogout}
            />
          </SettingsSection>
        </FadeIn>

        {/* Product Tagline */}
        <FadeIn delay={0.3}>
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground italic">
              "Você fala com a IA. Você encara a verdade no app."
            </p>
            <p className="text-xs text-muted-foreground mt-1">v1.0.0</p>
          </div>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

// Helper Components

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <div>
    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
      {title}
    </h2>
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      {children}
    </div>
  </div>
);

interface SettingsItemProps {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  labelColor?: string;
  description?: string;
  value?: string;
  valueColor?: string;
  badge?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
  locked?: boolean;
}

const SettingsItem = ({
  icon: Icon,
  iconColor,
  label,
  labelColor,
  description,
  value,
  valueColor,
  badge,
  action,
  onClick,
  showArrow,
  locked,
}: SettingsItemProps) => {
  const Wrapper = onClick ? "button" : "div";
  
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left border-b border-border last:border-b-0",
        onClick && "hover:bg-secondary/50 transition-colors",
        locked && "opacity-60"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
        locked ? "bg-muted" : "bg-muted"
      )}>
        <Icon className={cn("w-4 h-4", iconColor || "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
          {badge && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {value && !action && (
        <span className={cn("text-sm truncate max-w-[140px] text-right", valueColor || "text-muted-foreground")}>{value}</span>
      )}
      {action}
      {locked && <Lock className="w-4 h-4 text-muted-foreground" />}
      {showArrow && !locked && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </Wrapper>
  );
};

export default Settings;

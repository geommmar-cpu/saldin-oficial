import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthChecklist } from "@/components/PasswordStrengthChecklist";
import { BiometricSetupDialog } from "@/components/auth/BiometricSetupDialog";
import { supabase } from "@/lib/backendClient";
import logoSaldin from "@/assets/logo-saldin-final.png";


type AuthView = "login" | "signup" | "recovery";

export const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp, resetPassword } = useAuth();
  const { 
    isSupported: isBiometricSupported, 
    isEnabled: isBiometricEnabled,
    authenticateWithBiometric,
    isEnabledForUser,
    isLoading: isBiometricLoading,
  } = useWebAuthn();
  
  const [view, setView] = useState<AuthView>("login");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Biometric states
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [pendingBiometricUser, setPendingBiometricUser] = useState<{
    userId: string;
    userEmail: string;
  } | null>(null);
  

  // Redirect is handled by PublicRoute wrapper in App.tsx
  // No need to redirect here - the route guards handle it

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleViewChange = (newView: AuthView) => {
    resetForm();
    setView(newView);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      let message = "Ocorreu um erro ao fazer login.";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Confirme seu email antes de fazer login.";
      }
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
      return;
    }

    // Check if we should offer biometric setup
    const userId = data?.user?.id;
    const userEmail = data?.user?.email;
    
    if (userId && userEmail && isBiometricSupported && !isEnabledForUser(userId)) {
      // Check if user dismissed the prompt this session
      const dismissed = sessionStorage.getItem("biometric_prompt_dismissed");
      if (!dismissed) {
        setPendingBiometricUser({ userId, userEmail });
        setShowBiometricSetup(true);
        return; // Don't show success toast yet, wait for biometric decision
      }
    }

    toast({
      title: "Login realizado",
      description: "Bem-vindo de volta!",
    });
    // Navigation is handled by the auth state change in PublicRoute
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!isBiometricSupported || !isBiometricEnabled) return;

    setIsLoading(true);
    
    const result = await authenticateWithBiometric();
    
    if (result.success && result.userEmail) {
      // Get the stored password from secure storage or use a refresh token approach
      // For now, we'll show a success message and rely on existing session
      toast({
        title: "Biometria verificada",
        description: "Verificando sua sessão...",
      });
      
      // Check if there's an existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        toast({
          title: "Login realizado",
          description: "Bem-vindo de volta!",
        });
      } else {
        // No active session, need to enter password
        setEmail(result.userEmail);
        toast({
          title: "Biometria verificada",
          description: "Digite sua senha para continuar.",
        });
      }
    } else {
      toast({
        title: "Falha na autenticação",
        description: "Não foi possível verificar sua biometria. Use email e senha.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      let message = "A senha não atende aos requisitos de segurança.";
      if (passwordValidation.isCommonPassword) {
        message = "Esta senha é muito comum. Escolha uma senha mais forte.";
      }
      toast({
        title: "Senha inválida",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A confirmação de senha deve ser igual à senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(email, password, name);
    
    setIsLoading(false);
    
    if (error) {
      let message = "Ocorreu um erro ao criar a conta.";
      if (error.message.includes("User already registered")) {
        message = "Este email já está cadastrado.";
      } else if (error.message.includes("Password should be")) {
        message = "A senha deve ter pelo menos 6 caracteres.";
      }
      toast({
        title: "Erro no cadastro",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada",
      description: "Verifique seu email para confirmar o cadastro.",
    });
    handleViewChange("login");
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Digite seu email para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await resetPassword(email);
    
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o email de recuperação.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email enviado",
      description: "Verifique sua caixa de entrada para redefinir a senha.",
    });
    handleViewChange("login");
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3 flex items-center gap-4">
          {view !== "login" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleViewChange("login")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <FadeIn key={view}>
          {view === "login" && (
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              onSubmit={handleLogin}
              onForgotPassword={() => handleViewChange("recovery")}
              onCreateAccount={() => handleViewChange("signup")}
              showBiometricButton={isBiometricSupported && isBiometricEnabled}
              onBiometricLogin={handleBiometricLogin}
              isBiometricLoading={isBiometricLoading}
            />
          )}

          {view === "signup" && (
            <SignupForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              isLoading={isLoading}
              onSubmit={handleSignup}
              onBackToLogin={() => handleViewChange("login")}
            />
          )}

          {view === "recovery" && (
            <RecoveryForm
              email={email}
              setEmail={setEmail}
              isLoading={isLoading}
              onSubmit={handleRecovery}
              onBackToLogin={() => handleViewChange("login")}
            />
          )}
        </FadeIn>
      </main>

      {/* Biometric Setup Dialog */}
      {pendingBiometricUser && (
        <BiometricSetupDialog
          open={showBiometricSetup}
          onOpenChange={(open) => {
            setShowBiometricSetup(open);
            if (!open) {
              toast({
                title: "Login realizado",
                description: "Bem-vindo de volta!",
              });
              setPendingBiometricUser(null);
            }
          }}
          userId={pendingBiometricUser.userId}
          userEmail={pendingBiometricUser.userEmail}
          onSuccess={() => {
            toast({
              title: "Login realizado",
              description: "Bem-vindo de volta!",
            });
            setPendingBiometricUser(null);
          }}
        />
      )}
    </div>
  );
};

// Login Form Component
interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  showBiometricButton?: boolean;
  onBiometricLogin?: () => void;
  isBiometricLoading?: boolean;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  showBiometricButton,
  onBiometricLogin,
  isBiometricLoading,
}: LoginFormProps) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="text-center mb-8">
      <img src={logoSaldin} alt="Saldin" className="h-36 mx-auto mb-6" />
      <h1 className="font-serif text-3xl font-semibold">Entrar</h1>
      <p className="text-muted-foreground">
        Acesse seu painel de controle financeiro
      </p>
    </div>

    {/* Biometric Login Button */}
    {showBiometricButton && (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 gap-3"
          onClick={onBiometricLogin}
          disabled={isBiometricLoading || isLoading}
        >
          <Fingerprint className="w-6 h-6" />
          <span className="text-base">
            {isBiometricLoading ? "Verificando..." : "Entrar com biometria"}
          </span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              ou
            </span>
          </div>
        </div>
      </div>
    )}

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>

    <Button 
      type="submit" 
      className="w-full" 
      size="lg"
      disabled={isLoading}
    >
      {isLoading ? "Entrando..." : "Entrar"}
    </Button>

    <div className="flex flex-col items-center gap-3 pt-4">
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Esqueci minha senha
      </button>
      <button
        type="button"
        onClick={onCreateAccount}
        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Criar conta
      </button>
    </div>
  </form>
);

// Signup Form Component
interface SignupFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

const SignupForm = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  onSubmit,
  onBackToLogin,
}: SignupFormProps) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="text-center mb-8">
      <img src={logoSaldin} alt="Saldin" className="h-36 mx-auto mb-6" />
      <h1 className="font-serif text-3xl font-semibold">Criar conta</h1>
      <p className="text-muted-foreground">
        Preencha os dados para começar
      </p>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            autoComplete="name"
            maxLength={50}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Crie uma senha forte"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrengthChecklist password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>

    <Button 
      type="submit" 
      className="w-full" 
      size="lg"
      disabled={isLoading || !validatePassword(password).isValid}
    >
      {isLoading ? "Criando conta..." : "Criar conta"}
    </Button>

    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={onBackToLogin}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Já tenho uma conta
      </button>
    </div>
  </form>
);

// Recovery Form Component
interface RecoveryFormProps {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

const RecoveryForm = ({
  email,
  setEmail,
  isLoading,
  onSubmit,
  onBackToLogin,
}: RecoveryFormProps) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="text-center mb-8">
      <img src={logoSaldin} alt="Saldin" className="h-36 mx-auto mb-6" />
      <h1 className="font-serif text-3xl font-semibold">Recuperar senha</h1>
      <p className="text-muted-foreground">
        Digite seu email para receber o link de recuperação
      </p>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recovery-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="recovery-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
    </div>

    <Button 
      type="submit" 
      className="w-full" 
      size="lg"
      disabled={isLoading}
    >
      {isLoading ? "Enviando..." : "Enviar link de recuperação"}
    </Button>

    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={onBackToLogin}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Voltar ao login
      </button>
    </div>
  </form>
);

export default Auth;

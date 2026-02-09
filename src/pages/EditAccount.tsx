import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthChecklist } from "@/components/PasswordStrengthChecklist";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/backendClient";

export const EditAccount = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  // User data - initialized from auth/profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Initialize form with user data when available
  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    } else if (user?.user_metadata?.name || user?.user_metadata?.full_name) {
      setName(user.user_metadata.name || user.user_metadata.full_name || "");
    }
    
    if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome.",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }
    
    setSavingProfile(true);
    
    try {
      // Update profile name in profiles table
      await updateProfile.mutateAsync({ full_name: name.trim() });
      
      // Also update user_metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: { name: name.trim(), full_name: name.trim() },
      });
      
      // Update email if changed
      if (email.trim() !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) throw error;
      }
      
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      // Navigate to settings after successful save
      navigate("/settings");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar os dados.",
        variant: "destructive",
      });
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({
        title: "Senha atual obrigatória",
        description: "Por favor, insira sua senha atual.",
        variant: "destructive",
      });
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      let message = "A nova senha não atende aos requisitos de segurança.";
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
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação da senha não corresponde à nova senha.",
        variant: "destructive",
      });
      return;
    }
    
    setSavingPassword(true);
    
    try {
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("Senha atual incorreta.");
      }
      
      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Editar conta</h1>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Profile Section */}
        <FadeIn>
          <div className="bg-card rounded-xl border border-border shadow-soft p-5 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Informações pessoais
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  maxLength={100}
                />
              </div>
            </div>
            
            <Button 
              variant="warm" 
              className="w-full mt-2"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </FadeIn>

        {/* Security Section */}
        <FadeIn delay={0.1}>
          <div className="bg-card rounded-xl border border-border shadow-soft p-5 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Segurança
            </h2>
            
            <p className="text-sm text-muted-foreground">
              Para alterar sua senha, preencha os campos abaixo.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthChecklist password={newPassword} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={handleChangePassword}
              disabled={savingPassword || (!currentPassword && !newPassword && !confirmPassword) || (newPassword && !validatePassword(newPassword).isValid)}
            >
              {savingPassword ? (
                "Alterando senha..."
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Alterar senha
                </>
              )}
            </Button>
          </div>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

export default EditAccount;

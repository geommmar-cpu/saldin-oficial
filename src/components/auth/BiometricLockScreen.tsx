import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, KeyRound } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useToast } from "@/hooks/use-toast";
import { FadeIn } from "@/components/ui/motion";
import logoSaldin from "@/assets/logo-saldin-final.png";

interface BiometricLockScreenProps {
  userEmail: string;
  userName?: string;
  onUnlock: () => void;
  onUsePassword: () => void;
}

export function BiometricLockScreen({ 
  userEmail, 
  userName,
  onUnlock, 
  onUsePassword 
}: BiometricLockScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const { authenticateWithBiometric } = useWebAuthn();
  const { toast } = useToast();

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (!autoTriggered) {
      setAutoTriggered(true);
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoTriggered]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    const result = await authenticateWithBiometric();
    
    if (result.success) {
      toast({
        title: "Bem-vindo de volta!",
        description: "Acesso liberado.",
      });
      onUnlock();
    } else {
      toast({
        title: "Falha na autenticação",
        description: "Tente novamente ou use sua senha.",
        variant: "destructive",
      });
    }
    
    setIsAuthenticating(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <FadeIn>
        <div className="text-center space-y-8 max-w-sm mx-auto">
          {/* Logo */}
          <img src={logoSaldin} alt="Saldin" className="h-28 mx-auto" />
          
          {/* User greeting */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold">
              Olá{userName ? `, ${userName}` : " novamente"}!
            </h1>
          </div>

          {/* Biometric button */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full h-14 gap-3"
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-base">
                {isAuthenticating ? "Verificando..." : "Desbloquear com biometria"}
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={onUsePassword}
            >
              <KeyRound className="w-4 h-4" />
              Usar senha
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

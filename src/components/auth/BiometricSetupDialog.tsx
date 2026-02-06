import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, Smartphone, X } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useToast } from "@/hooks/use-toast";

interface BiometricSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export function BiometricSetupDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  onSuccess,
}: BiometricSetupDialogProps) {
  const [isActivating, setIsActivating] = useState(false);
  const { registerBiometric, isSupported } = useWebAuthn();
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu dispositivo não suporta autenticação biométrica.",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    
    const success = await registerBiometric(userId, userEmail);
    
    setIsActivating(false);

    if (success) {
      toast({
        title: "Biometria ativada!",
        description: "Na próxima vez, você pode usar sua biometria para entrar.",
      });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast({
        title: "Erro ao ativar",
        description: "Não foi possível ativar a biometria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    // Save preference to not show again for this session
    sessionStorage.setItem("biometric_prompt_dismissed", "true");
    onOpenChange(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Ativar login por biometria?</DialogTitle>
          <DialogDescription className="text-center">
            Use sua impressão digital ou Face ID para entrar mais rapidamente no próximo acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
          <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Seus dados biométricos ficam armazenados apenas no seu dispositivo, garantindo sua segurança.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleActivate} 
            disabled={isActivating}
            className="w-full"
          >
            {isActivating ? (
              "Ativando..."
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Ativar biometria
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full"
          >
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

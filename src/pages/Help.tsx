
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";

export const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Ajuda</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6">
        <FadeIn>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Perguntas Frequentes (FAQ)</h2>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">Como cadastro uma conta bancária?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vá até a tela inicial, clique em "Contas Bancárias" e depois no botão de adicionar (+). Selecione seu banco e informe o saldo inicial.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">O que é o Saldo Livre?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Saldo Livre é o valor que você realmente pode gastar. Ele desconta suas contas fixas, dívidas e metas de poupança do seu saldo total.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">Como funciona a integração com WhatsApp?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nas configurações, clique em "Reconectar" no Assistente WhatsApp. Envie uma mensagem como "Gastei 50 reais no mercado" e o Saldin registrará automaticamente.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">Meus dados estão seguros?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sim! Usamos criptografia de ponta a ponta e seus dados são armazenados de forma segura. Ninguém, nem mesmo nossa equipe, tem acesso aos seus dados bancários.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border mt-8">
            <h3 className="font-medium mb-2">Ainda precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Entre em contato com nosso suporte técnico.
            </p>
            <Button className="w-full" onClick={() => window.open("mailto:suporte@saldin.app")}>
              Enviar Email
            </Button>
          </div>
        </FadeIn>
      </main>
    </div>
  );
};

export default Help;

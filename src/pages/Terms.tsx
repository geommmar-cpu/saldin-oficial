
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";

export const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <FadeIn>
          <p>Última atualização: 12 de Fevereiro de 2026</p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">1. Aceitação</h2>
          <p>
            Ao utilizar o aplicativo Saldin, você concorda com estes termos de serviço.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">2. Uso do Serviço</h2>
          <p>
            O Saldin é uma ferramenta de gestão financeira pessoal. Você é responsável por manter a confidencialidade de sua conta e senha.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">3. Dados Financeiros</h2>
          <p>
            Não realizamos transações bancárias reais. O aplicativo serve apenas para registro e organização de informações fornecidas por você.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">4. Modificações</h2>
          <p>
            Reservamo-nos o direito de modificar o serviço ou estes termos a qualquer momento.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">5. Contato</h2>
          <p>
            Dúvidas sobre os termos podem ser enviadas para termos@saldin.app.
          </p>
        </FadeIn>
      </main>
    </div>
  );
};

export default Terms;

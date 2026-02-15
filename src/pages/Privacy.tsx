
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";

export const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Privacidade</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <FadeIn>
          <p>Última atualização: 12 de Fevereiro de 2026</p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">1. Coleta de Dados</h2>
          <p>
            Coletamos apenas as informações que você fornece voluntariamente para o funcionamento do app: nome, email e dados financeiros (transações, saldos, metas).
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">2. Uso das Informações</h2>
          <p>
            As informações são usadas exclusivamente para gerar seus relatórios, backups e manter o serviço funcionando.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">3. Compartilhamento</h2>
          <p>
            Não vendemos nem compartilhamos seus dados financeiros com terceiros para fins de marketing.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">4. Segurança</h2>
          <p>
            Utilizamos criptografia padrão da indústria para proteger seus dados em trânsito e em repouso.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">5. Seus Direitos</h2>
          <p>
            Você pode solicitar a exportação ou exclusão completa dos seus dados a qualquer momento através das Configurações do aplicativo.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">6. Contato</h2>
          <p>
            Para questões de privacidade, contate privacidade@saldin.app.
          </p>
        </FadeIn>
      </main>
    </div>
  );
};

export default Privacy;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Shield, Database, Eye, Users, Lock, UserCheck, Mail } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="px-5 space-y-5">
        <FadeIn>
          <p className="text-xs text-muted-foreground">Última atualização: Fevereiro de 2026</p>
          <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
            Sua privacidade é importante para nós. Esta política explica de forma clara e simples 
            como tratamos seus dados no Saldin, em conformidade com a LGPD (Lei Geral de Proteção de Dados).
          </p>
        </FadeIn>

        <FadeIn delay={0.02}>
          <PrivacySection icon={Database} title="Dados que coletamos">
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong>Nome e email</strong> — para criar e identificar sua conta</li>
              <li><strong>Dados financeiros</strong> — receitas, gastos, dívidas, metas e valores a receber que você insere manualmente</li>
              <li><strong>Dados de uso</strong> — como você navega no app, para melhorar a experiência</li>
              <li><strong>Dados do dispositivo</strong> — tipo de aparelho e sistema operacional, para compatibilidade</li>
            </ul>
          </PrivacySection>
        </FadeIn>

        <FadeIn delay={0.04}>
          <PrivacySection icon={Eye} title="Como usamos seus dados">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Organizar e exibir suas informações financeiras dentro do app</li>
              <li>Gerar relatórios e insights personalizados</li>
              <li>Melhorar a experiência do usuário e corrigir problemas</li>
              <li>Garantir a segurança da sua conta</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
            </ul>
          </PrivacySection>
        </FadeIn>

        <FadeIn delay={0.06}>
          <PrivacySection icon={Users} title="Compartilhamento de dados">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Nós não vendemos seus dados. Ponto final.</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Não compartilhamos suas informações com terceiros sem seu consentimento</li>
                <li>Não usamos seus dados para publicidade de terceiros</li>
                <li>Integrações futuras (como bancos) serão sempre opcionais e com sua autorização</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Podemos compartilhar dados apenas quando exigido por lei ou ordem judicial.
              </p>
            </div>
          </PrivacySection>
        </FadeIn>

        <FadeIn delay={0.08}>
          <PrivacySection icon={Lock} title="Segurança dos dados">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Seus dados são armazenados em servidores seguros com criptografia</li>
              <li>Usamos boas práticas de segurança da informação</li>
              <li>Proteção contra acesso não autorizado</li>
              <li>Autenticação segura com opção de biometria</li>
              <li>Monitoramento constante para prevenir incidentes</li>
            </ul>
          </PrivacySection>
        </FadeIn>

        <FadeIn delay={0.1}>
          <PrivacySection icon={UserCheck} title="Seus direitos (LGPD)">
            <p className="mb-2">Você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong>Acessar</strong> — ver todos os dados que temos sobre você</li>
              <li><strong>Corrigir</strong> — atualizar informações incorretas</li>
              <li><strong>Excluir</strong> — solicitar a remoção dos seus dados</li>
              <li><strong>Cancelar</strong> — encerrar sua conta e apagar seus dados</li>
              <li><strong>Portabilidade</strong> — exportar seus dados em formato acessível</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Para exercer qualquer desses direitos, entre em contato pelo canal abaixo.
            </p>
          </PrivacySection>
        </FadeIn>

        <FadeIn delay={0.12}>
          <PrivacySection icon={Mail} title="Contato">
            <p>
              Para dúvidas sobre privacidade ou para exercer seus direitos, 
              entre em contato:
            </p>
            <p className="mt-2 font-medium text-primary">privacidade@saldin.com.br</p>
            <p className="text-xs text-muted-foreground mt-2">
              Responderemos em até 15 dias úteis, conforme previsto pela LGPD.
            </p>
          </PrivacySection>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

const PrivacySection = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border shadow-soft p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-foreground/80 leading-relaxed">
      {children}
    </div>
  </div>
);

export default Privacy;

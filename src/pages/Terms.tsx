import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="px-5 space-y-5">
        <FadeIn>
          <p className="text-xs text-muted-foreground">Última atualização: Fevereiro de 2026</p>
        </FadeIn>

        <FadeIn delay={0.02}>
          <TermsSection title="1. Aceitação dos Termos">
            <p>
              Ao usar o Saldin, você concorda com estes termos. Se não concordar com algum ponto,
              recomendamos que não utilize o aplicativo. Podemos atualizar estes termos e você será
              notificado sobre mudanças importantes.
            </p>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.04}>
          <TermsSection title="2. O que é o Saldin">
            <p>
              O Saldin é um aplicativo de organização financeira pessoal. Ele permite que você registre 
              receitas, gastos, dívidas, valores a receber e metas — tudo para te dar clareza sobre 
              sua vida financeira.
            </p>
            <p className="mt-2 font-medium text-foreground">
              Importante: o Saldin não é um serviço financeiro, não oferece consultoria de investimentos 
              e não realiza transações bancárias. Ele é uma ferramenta de controle e organização.
            </p>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.06}>
          <TermsSection title="3. Sua responsabilidade">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Manter suas credenciais de acesso seguras</li>
              <li>Inserir informações verdadeiras e atualizadas</li>
              <li>Não usar o app para atividades ilegais</li>
              <li>Não tentar acessar contas de outros usuários</li>
            </ul>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.08}>
          <TermsSection title="4. Limitações do aplicativo">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Todos os dados financeiros são inseridos manualmente por você</li>
              <li>O app pode ter instabilidades temporárias</li>
              <li>Funcionalidades podem ser alteradas ou descontinuadas</li>
              <li>Relatórios e insights são estimativas baseadas nos dados que você inseriu</li>
            </ul>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.1}>
          <TermsSection title="5. Isenção de responsabilidade financeira">
            <p>
              O Saldin é uma ferramenta de organização. Nenhuma informação exibida no app deve 
              ser considerada como aconselhamento financeiro, fiscal ou jurídico. Decisões financeiras 
              são de sua inteira responsabilidade.
            </p>
            <p className="mt-2">
              Recomendamos consultar profissionais qualificados para decisões importantes sobre 
              investimentos, impostos ou planejamento financeiro.
            </p>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.12}>
          <TermsSection title="6. Conta e encerramento">
            <p>
              Você pode encerrar sua conta a qualquer momento nas configurações do app. 
              Ao fazer isso, seus dados serão excluídos conforme nossa Política de Privacidade.
            </p>
            <p className="mt-2">
              Podemos suspender ou encerrar contas que violem estes termos ou que representem 
              risco à segurança da plataforma.
            </p>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.14}>
          <TermsSection title="7. Alterações nos termos">
            <p>
              Podemos atualizar estes termos periodicamente. Mudanças significativas serão comunicadas 
              pelo app. O uso contínuo após as alterações significa que você concorda com os novos termos.
            </p>
          </TermsSection>
        </FadeIn>

        <FadeIn delay={0.16}>
          <TermsSection title="8. Contato">
            <p>
              Se tiver dúvidas sobre estes termos, entre em contato pelo email:
            </p>
            <p className="mt-1 font-medium text-primary">contato@saldin.com.br</p>
          </TermsSection>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

const TermsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border shadow-soft p-4">
    <div className="flex items-center gap-2 mb-3">
      <FileText className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-foreground/80 leading-relaxed">
      {children}
    </div>
  </div>
);

export default Terms;

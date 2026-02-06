import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  Sparkles,
  Wallet,
  Receipt,
  TrendingUp,
  Target,
  CreditCard,
  HandCoins,
  FileText,
  MessageCircle,
  Landmark,
  HelpCircle,
  Rocket,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Ajuda</h1>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Primeiros Passos */}
        <FadeIn>
          <Section title="Primeiros Passos" icon={Rocket}>
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <div>
                <h4 className="font-semibold text-foreground mb-1">O que é o Saldin?</h4>
                <p>
                  O Saldin é seu organizador financeiro pessoal. Ele te ajuda a entender para onde seu dinheiro vai,
                  quanto você tem de verdade e como se planejar melhor.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Para que serve?</h4>
                <p>
                  Para registrar seus gastos, receitas, dívidas e metas — tudo num lugar só.
                  Você tem clareza sobre sua vida financeira sem precisar de planilhas complicadas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Como começar?</h4>
                <p>
                  Cadastre suas receitas (salário, freelas, etc.) e registre seus gastos do dia a dia.
                  Com o tempo, o Saldin mostra padrões e te ajuda a tomar decisões melhores.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">O que é Saldo Livre?</h4>
                <p>
                  É o dinheiro que sobra depois de tirar todas as contas fixas, dívidas e compromissos.
                  É o valor que você realmente pode usar sem se apertar.
                </p>
              </div>
            </div>
          </Section>
        </FadeIn>

        {/* Funcionalidades Principais */}
        <FadeIn delay={0.05}>
          <Section title="Funcionalidades" icon={Sparkles}>
            <div className="space-y-3">
              <FeatureItem
                icon={Receipt}
                title="Gastos"
                description="Registre cada gasto com categoria, data e valor. Veja para onde seu dinheiro vai e identifique padrões."
              />
              <FeatureItem
                icon={Wallet}
                title="Receitas"
                description="Cadastre seus ganhos: salário, freelas, rendimentos. Saiba quanto entra todo mês."
              />
              <FeatureItem
                icon={Target}
                title="Metas financeiras"
                description="Crie metas de economia e acompanhe o progresso. Guarde dinheiro com propósito."
              />
              <FeatureItem
                icon={CreditCard}
                title="Dívidas"
                description="Controle parcelas, cartão de crédito e empréstimos. Saiba quanto falta para quitar."
              />
              <FeatureItem
                icon={HandCoins}
                title="Valores a receber"
                description="Registre quem te deve e acompanhe o status. Esse valor não entra no saldo até ser recebido."
              />
              <FeatureItem
                icon={TrendingUp}
                title="Cartão de crédito"
                description="Controle compras parceladas, veja o comprometimento mensal e quanto ainda falta pagar."
              />
              <FeatureItem
                icon={FileText}
                title="Relatórios"
                description="Exporte um PDF completo com resumo financeiro, gastos por categoria, dívidas e metas."
              />
            </div>
          </Section>
        </FadeIn>

        {/* FAQ */}
        <FadeIn delay={0.1}>
          <Section title="Perguntas Frequentes" icon={HelpCircle}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="banks">
                <AccordionTrigger className="text-sm text-left">
                  O app conecta com bancos?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Ainda não, mas essa funcionalidade está sendo desenvolvida. Por enquanto, você insere suas
                  movimentações manualmente, o que te dá mais consciência sobre cada gasto.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security">
                <AccordionTrigger className="text-sm text-left">
                  Meus dados estão seguros?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Sim! Seus dados são armazenados de forma segura com criptografia. 
                  Ninguém além de você tem acesso às suas informações financeiras.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="offline">
                <AccordionTrigger className="text-sm text-left">
                  Posso usar o app offline?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  O Saldin funciona melhor com internet para sincronizar seus dados. 
                  Algumas telas podem ser acessadas offline, mas recomendamos conexão para garantir que nada se perca.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delete">
                <AccordionTrigger className="text-sm text-left">
                  O que acontece se eu apagar uma movimentação?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  A movimentação é removida permanentemente e o saldo é recalculado automaticamente. 
                  Por isso, sempre confirme antes de excluir.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="goals">
                <AccordionTrigger className="text-sm text-left">
                  Como funcionam as metas?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Você define um objetivo (ex: viagem de R$ 3.000), registra quanto já guardou e acompanha o 
                  progresso em porcentagem. O valor guardado em metas é separado do seu saldo livre.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>
        </FadeIn>

        {/* Em breve */}
        <FadeIn delay={0.15}>
          <Section title="Em breve" icon={Clock}>
            <div className="space-y-3">
              <ComingSoonItem
                icon={MessageCircle}
                title="Agente WhatsApp"
                description="Registre gastos e consulte seu saldo direto pelo WhatsApp, conversando com seu gerenciador pessoal."
              />
              <ComingSoonItem
                icon={Landmark}
                title="Conexão com bancos"
                description="Importe transações automaticamente do seu banco. Sem precisar digitar nada."
              />
            </div>
          </Section>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const Section = ({ title, icon: Icon, children }: SectionProps) => (
  <div>
    <div className="flex items-center gap-2 mb-2 px-1">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h2>
    </div>
    <div className="bg-card rounded-xl border border-border shadow-soft p-4">
      {children}
    </div>
  </div>
);

const FeatureItem = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
    </div>
  </div>
);

const ComingSoonItem = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex gap-3 items-start opacity-70">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Em breve</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
    </div>
  </div>
);

export default Help;

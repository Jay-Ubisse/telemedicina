import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CalendarClock,
  ClipboardCheck,
  Globe,
  Send,
  Smartphone,
  Video,
} from "lucide-react";

import { EmergencyNotice } from "@/components/layout/emergency-notice";
import { CareIllustration } from "@/components/marketing/care-illustration";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

/**
 * Página inicial, reformulada segundo o relatório.
 *
 * A estrutura é exactamente a pedida: cabeçalho reduzido ao essencial, uma
 * primeira secção com texto curto e uma ilustração pediátrica, o aviso de
 * emergência imediatamente depois, cinco etapas em «Como funciona», duas formas
 * de acesso e uma chamada final.
 *
 * Saíram da página pública, por exigência expressa: a fila de triagem, os
 * pedidos e casos clínicos demonstrativos, nomes, idades, bairros e contactos de
 * crianças, gráficos e indicadores administrativos, a classificação por
 * gravidade, a «triagem automática», o «protocolo de triagem», o «tempo
 * decorrido — mediana», a promessa de atendimento «em menos de uma hora», a
 * palavra «diagnóstico», qualquer referência a «SMS enviado», «USSD sobre GSM» e
 * FHIR / HL7 / WebRTC como tecnologias implementadas, os números de pedidos,
 * consultas e pediatras, e o excesso de imagens e texto técnico.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <EmergencySection />
        <HowItWorks />
        <AccessChannels />
        <ClosingCall />
      </main>

      <SiteFooter />
    </div>
  );
}

/** Primeira secção: texto à esquerda, ilustração à direita. Nada mais. */
function Hero() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto grid w-full max-w-[86rem] items-center gap-12 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20 lg:pb-24">
        <div>
          <h1 className="max-w-xl font-heading text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance sm:text-[3.25rem]">
            Cuidado pediátrico mais próximo da sua família
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Solicite acompanhamento pediátrico à distância através da plataforma
            de telepediatria do Hospital Geral de Mavalane.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="rounded-lg">
              <Link href="/registo">
                Solicitar teleconsulta
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-lg">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        <CareIllustration className="mx-auto w-full max-w-xl lg:max-w-none" />
      </div>
    </section>
  );
}

/** Aviso de emergência, logo depois da primeira secção. */
function EmergencySection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-8 sm:px-8">
        <EmergencyNotice />
      </div>
    </section>
  );
}

/**
 * Cinco etapas, sem triagem automática, sem classificação automática de
 * prioridade, sem tempos médios e sem diagnóstico feito pelo sistema.
 */
const steps = [
  {
    title: "Registar a criança",
    icon: Baby,
    body: "Crie a conta da família e registe os dados da criança que vai ser acompanhada.",
  },
  {
    title: "Submeter o pedido",
    icon: Send,
    body: "Indique os sintomas, a modalidade de atendimento e as observações que considerar úteis.",
  },
  {
    title: "Triagem por profissional de saúde",
    icon: ClipboardCheck,
    body: "Um profissional de triagem do HGM analisa o pedido, define a prioridade e o seguimento.",
  },
  {
    title: "Agendamento da consulta",
    icon: CalendarClock,
    body: "O pedido é atribuído a um pediatra, que define o dia e a hora do atendimento.",
  },
  {
    title: "Realização da teleconsulta",
    icon: Video,
    // Redacção aprovada no §5 do relatório, em substituição de
    // «Diagnóstico, recomendações e, se for preciso, encaminhamento presencial.»
    body: "Avaliação do pedido, orientação clínica e, quando necessário, encaminhamento para atendimento presencial.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
        <h2 className="font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
          Como funciona
        </h2>
        {/*
          Legenda do percurso com a redacção aprovada no §5, em substituição de
          «De um pedido a uma orientação, em menos de uma hora.» — não se
          prometem tempos de atendimento.
        */}
        <p className="mt-3 text-muted-foreground">
          Exemplo ilustrativo do percurso de atendimento no protótipo.
        </p>

        <ol className="mt-10 grid gap-px border-t border-border sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title} className="pt-6 lg:pr-6">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"
              >
                <step.icon className="size-5" />
              </span>

              <p className="mt-4 text-sm font-semibold text-primary tabular-nums">
                {index + 1}
              </p>
              <h3 className="mt-1 font-heading text-lg font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Duas formas de acesso: plataforma web e simulador USSD. */
function AccessChannels() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
        <h2 className="font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
          Formas de acesso
        </h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"
            >
              <Globe className="size-5" />
            </span>

            <h3 className="mt-5 font-heading text-xl font-bold tracking-tight">
              Plataforma web
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Permite criar uma conta, registar a criança, submeter o pedido e
              acompanhar o atendimento.
            </p>

            <Button asChild size="xl" className="mt-7 self-start rounded-lg">
              <Link href="/registo">
                Criar conta
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </article>

          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground"
            >
              <Smartphone className="size-5" />
            </span>

            <h3 className="mt-5 font-heading text-xl font-bold tracking-tight">
              Simulador USSD
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Demonstra como poderia ser solicitada uma teleconsulta através de
              um telemóvel sem acesso à Internet.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sem acesso à Internet? Veja como seria a solicitação de uma
              teleconsulta através do Simulador USSD.
            </p>

            <Button
              asChild
              size="xl"
              variant="outline"
              className="mt-7 self-start rounded-lg"
            >
              <Link href="/ussd">Abrir Simulador USSD</Link>
            </Button>
          </article>
        </div>
      </div>
    </section>
  );
}

/** Chamada final. */
function ClosingCall() {
  return (
    <section>
      <div className="mx-auto w-full max-w-[86rem] px-5 py-16 sm:px-8 lg:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-xl font-heading text-3xl font-extrabold tracking-[-0.035em] text-balance sm:text-4xl">
            Precisa de solicitar acompanhamento pediátrico?
          </h2>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="rounded-lg">
              <Link href="/registo">Criar conta</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-lg">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="rounded-lg">
              <Link href="/ussd">Conhecer o Simulador USSD</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

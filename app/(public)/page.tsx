import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { CareScene } from "@/components/marketing/care-scene";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { UssdTerminal } from "@/components/marketing/ussd-terminal";
import { Button } from "@/components/ui/button";
import { SEED_ANCHOR, buildSeedConsultations, seedUsers } from "@/lib/data/seed";
import {
  criticalSymptoms,
  mildSymptoms,
  urgentSymptoms,
} from "@/lib/data/symptoms";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <Masthead />
        <Instrument />
        <Evidence />
        <TriageProtocol />
        <Journey />
        <Professionals />
        <Specification />
        <ClosingCall />
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Abertura da página.
 *
 * O relatório de testes pediu que a primeira área comunicasse de imediato o
 * conceito de telepediatria — cuidado pediátrico, proximidade familiar e
 * acesso por telemóvel — em vez de abrir com o código USSD isolado. Daí o par
 * texto + cena de teleconsulta, com a linguagem acolhedora e institucional e
 * a ressalva explícita de que o serviço não substitui a urgência.
 */
const heroChecks = [
  "Com ou sem internet",
  "Pediatras do HGM",
  "Crianças dos 0 aos 15 anos",
  "Cidade de Maputo",
];

function Masthead() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto grid w-full max-w-[86rem] items-center gap-12 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20 lg:pb-24">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-8 bg-primary" />
            <p className="text-[0.6875rem] tracking-[0.18em] text-primary font-semibold uppercase">
              Hospital Geral de Mavalane · Telepediatria
            </p>
          </div>

          <h1 className="mt-7 max-w-2xl font-heading text-[2.5rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-[3.25rem] lg:text-[3.75rem]">
            Cuidado pediátrico ao alcance da sua família.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Solicite apoio pediátrico no Hospital Geral de Mavalane através do
            telemóvel, com ou sem internet. A equipa avalia os sintomas da
            criança, organiza o atendimento e fornece orientação clínica à
            distância.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="rounded-lg">
              <Link href="/registo">
                Solicitar consulta
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-lg">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
            {heroChecks.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="size-3.5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-md border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
            A telepediatria complementa o acompanhamento no hospital. Não
            substitui consultas presenciais nem os serviços de emergência: em
            caso de sintoma grave, ligue <span className="font-semibold text-foreground">1420</span>{" "}
            ou dirija-se à unidade sanitária mais próxima.
          </p>
        </div>

        <CareScene className="mx-auto w-full max-w-lg lg:max-w-none" />
      </div>
    </section>
  );
}

/** O mecanismo real do serviço: a sessão USSD e o registo clínico que dela resulta. */
function Instrument() {
  return (
    <section id="servico" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
        <p className="text-[0.6875rem] tracking-[0.2em] text-primary font-semibold uppercase">
          Como funciona
        </p>
        <h2 className="mt-5 max-w-2xl font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
          Um pedido feito num telemóvel sem internet, já triado do outro lado.
        </h2>

        {/* Moldura de simulação: terminal + registo resultante */}
        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
            <p className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
              Simulação · pedido real em 4 passos
            </p>
            <p className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
              Dados fictícios e anonimizados
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            <UssdTerminal className="border-b border-border md:border-r md:border-b-0" />
            <ResultingRecord />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * O que o pedido USSD produz do lado do hospital.
 *
 * Os dados são fictícios e ainda assim apresentados anonimizados: a criança é
 * identificada por iniciais e referência, o número aparece parcialmente
 * ocultado e a localização fica-se pelo bairro. É a mesma regra que vigora
 * dentro da plataforma.
 */
function ResultingRecord() {
  const rows = [
    { label: "Referência", value: "R-1042" },
    { label: "Criança", value: "T. M. · 4 anos" },
    { label: "Contacto", value: "+258 84 *** 3390" },
    { label: "Bairro", value: "Hulene B, Maputo" },
    { label: "Sintoma", value: "Febre alta" },
    { label: "Canal", value: "Videochamada" },
  ];

  return (
    <div className="flex flex-col bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="text-[0.625rem] tracking-[0.18em] text-muted-foreground font-semibold uppercase">
          Fila de triagem
        </span>
        <span className="rounded-sm bg-warning/20 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.12em] text-warning-foreground uppercase">
          Urgente
        </span>
      </div>

      <dl className="flex-1 px-4 py-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2.5 last:border-0"
          >
            <dt className="text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
              {row.label}
            </dt>
            <dd className="text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-border px-4 py-4">
        <p className="text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
          Agendado
        </p>
        <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight">
          10:00
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Link enviado por SMS. Expira 10 minutos depois da hora marcada.
        </p>
      </div>
    </div>
  );
}

/**
 * Indicadores da demonstração.
 *
 * A versão anterior anunciava 12 340 consultas e 48 pediatras — números que
 * não correspondiam a nada dentro do protótipo. Passam a ser lidos dos dados
 * de demonstração e ficam identificados como ilustrativos.
 */
const demoConsultations = buildSeedConsultations(SEED_ANCHOR);
const demoPediatricians = seedUsers.filter((user) => user.role === "PEDIATRA");

const evidence = [
  {
    value: String(demoConsultations.length),
    label: "Pedidos na demonstração",
  },
  {
    value: String(demoPediatricians.length),
    label: "Pediatras na escala",
  },
  { value: "0–15", label: "Anos de idade atendidos" },
  { value: "10 min", label: "Validade do link da sala" },
];

function Evidence() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto w-full max-w-[86rem] px-5 pt-8 sm:px-8">
        <p className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
          Dados ilustrativos do protótipo · não são estatísticas do serviço
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-[86rem] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
        {evidence.map((item, index) => (
          <div
            key={item.label}
            className={[
              "py-8 lg:py-10",
              index % 2 === 1 ? "border-l border-border pl-6" : "",
              index >= 2 ? "border-t border-border lg:border-t-0" : "",
              index > 0 ? "lg:border-l lg:border-border lg:pl-8" : "",
            ].join(" ")}
          >
            <p className="font-heading text-3xl font-extrabold tracking-[-0.03em] text-primary tabular-nums lg:text-[2.75rem]">
              {item.value}
            </p>
            <p className="mt-2 text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * O protocolo de triagem. É uma escala clínica ordenada — a ordem carrega
 * informação —, por isso é apresentada como a tabela que realmente é, com o
 * peso visual a subir até ao nível crítico.
 */
const triageLevels = [
  {
    level: "Leve",
    symptoms: mildSymptoms,
    response: "Teleconsulta regular",
    tone: "bg-card",
    accent: "text-success",
  },
  {
    level: "Urgente",
    symptoms: urgentSymptoms,
    response: "Teleconsulta prioritária",
    tone: "bg-warning/8",
    accent: "text-warning-foreground",
  },
  {
    level: "Crítico",
    symptoms: criticalSymptoms,
    response: "Encaminhamento imediato",
    tone: "bg-ink text-ink-foreground",
    accent: "text-destructive",
  },
];

function TriageProtocol() {
  return (
    <section id="triagem" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[0.6875rem] tracking-[0.2em] text-primary font-semibold uppercase">
            Protocolo de triagem
          </p>
          <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
            Nem todos os sintomas esperam pela mesma resposta.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Cada pedido é classificado automaticamente no momento em que chega.
            Um sintoma crítico dispensa a fila e encaminha a criança para a
            unidade sanitária mais próxima.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[7rem_1fr_15rem] gap-6 border-b border-border bg-muted/50 px-5 py-2.5 md:grid">
            {["Nível", "Sintomas", "Resposta"].map((head) => (
              <p
                key={head}
                className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase"
              >
                {head}
              </p>
            ))}
          </div>

          {triageLevels.map((row, index) => (
            <div
              key={row.level}
              className={[
                "gap-6 px-5 py-5 md:grid md:grid-cols-[7rem_1fr_15rem] md:items-center",
                row.tone,
                index > 0 ? "border-t border-border" : "",
              ].join(" ")}
            >
              <p
                className={`font-heading text-lg font-bold tracking-tight ${row.accent}`}
              >
                {row.level}
              </p>

              <ul className="mt-3 flex flex-wrap gap-1.5 md:mt-0">
                {row.symptoms.map((symptom) => (
                  <li
                    key={symptom}
                    className={[
                      "rounded-sm px-2 py-1 text-xs",
                      row.level === "Crítico"
                        ? "bg-white/10 text-ink-foreground"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {symptom}
                  </li>
                ))}
              </ul>

              <p
                className={[
                  "mt-3 text-sm font-medium md:mt-0",
                  row.level === "Crítico" ? "text-ink-foreground" : "",
                ].join(" ")}
              >
                {row.response}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * O percurso é medido em tempo decorrido, não em passos abstractos — é assim
 * que a família o vive.
 */
const journey = [
  {
    stamp: "00:00",
    title: "O pedido chega",
    body: "Por *123# no telemóvel ou pelo formulário web, com os sintomas da criança.",
  },
  {
    stamp: "00:01",
    title: "Triagem automática",
    body: "O sistema classifica a gravidade e coloca o caso na fila pela ordem certa.",
  },
  {
    stamp: "00:18",
    title: "O pediatra marca",
    body: "Escolhe a hora e o canal. Em videochamada, o link segue por SMS.",
  },
  {
    stamp: "00:45",
    title: "Orientação clínica",
    body: "Diagnóstico, recomendações e, se for preciso, encaminhamento presencial.",
  },
];

function Journey() {
  return (
    <section id="percurso" className="scroll-mt-24 border-b border-border bg-paper">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[0.6875rem] tracking-[0.2em] text-primary font-semibold uppercase">
              Percurso
            </p>
            <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              De um pedido a uma orientação, em menos de uma hora.
            </h2>
          </div>
          <p className="text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
            Tempo decorrido · mediana
          </p>
        </div>

        <ol className="mt-12 grid gap-px border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((item) => (
            <li key={item.stamp} className="relative pt-6 lg:pr-6">
              <span
                aria-hidden
                className="absolute -top-px left-0 h-px w-10 bg-primary"
              />
              <p className="text-sm font-semibold tracking-[0.08em] text-primary tabular-nums">
                {item.stamp}
              </p>
              <h3 className="mt-3 font-heading text-lg font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const professionalTools = [
  {
    title: "Fila ordenada por gravidade",
    body: "Casos críticos no topo, com a idade da criança sempre visível.",
  },
  {
    title: "Sala de teleconsulta integrada",
    body: "Vídeo, chat, anexos e notas clínicas no mesmo ecrã.",
  },
  {
    title: "Histórico clínico por criança",
    body: "Consultas, orientações e encaminhamentos reunidos num registo.",
  },
];

function Professionals() {
  return (
    <section
      id="profissionais"
      className="scroll-mt-24 bg-ink text-ink-foreground"
    >
      <div className="mx-auto w-full max-w-[86rem] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="text-[0.6875rem] tracking-[0.2em] text-primary font-semibold uppercase">
              Para profissionais
            </p>
            <h2 className="mt-5 max-w-lg font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Construído para a realidade de um hospital público.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-muted">
              Sem licenças por posto, sem hardware dedicado e sem depender de
              banda larga do lado da família. Preparado para integrar com
              sistemas HIS/EHR via FHIR e HL7.
            </p>

            <dl className="mt-10 border-t border-ink-line">
              {professionalTools.map((tool) => (
                <div key={tool.title} className="border-b border-ink-line py-5">
                  <dt className="font-heading font-bold tracking-tight">
                    {tool.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {tool.body}
                  </dd>
                </div>
              ))}
            </dl>

            <Button
              asChild
              size="xl"
              className="mt-9 rounded-lg bg-ink-foreground text-ink hover:bg-ink-foreground/90"
            >
              <Link href="/login">
                Aceder como profissional
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <QueuePreview />
        </div>
      </div>
    </section>
  );
}

/**
 * Amostra do painel clínico. Dados fictícios e sem identificação: é assim que
 * a fila de triagem aparece a um pediatra antes de assumir o caso.
 */
function QueuePreview() {
  const queue = [
    { ref: "R-1042", age: "4 anos", symptom: "Febre alta, tosse", level: "Urgente", tone: "text-warning" },
    { ref: "R-1039", age: "3 anos", symptom: "Manchas na pele (texto livre)", level: "Avaliação", tone: "text-primary" },
    { ref: "R-1030", age: "6 anos", symptom: "Convulsões", level: "Crítico", tone: "text-destructive" },
    { ref: "R-1036", age: "9 anos", symptom: "Vómitos persistentes", level: "Urgente", tone: "text-warning" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-ink-line bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 border-b border-ink-line px-5 py-3">
        <p className="text-[0.625rem] tracking-[0.16em] text-ink-muted font-semibold uppercase">
          Fila de triagem · hoje
        </p>
        <p className="text-[0.625rem] tracking-[0.16em] text-ink-muted font-semibold uppercase">
          Amostra
        </p>
      </div>

      <ul>
        {queue.map((item) => (
          <li
            key={item.ref}
            className="flex items-center justify-between gap-4 border-b border-ink-line px-5 py-4 last:border-0"
          >
            <div className="min-w-0">
              <p className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted">{item.ref}</span>
                <span className="text-sm font-medium">Criança · {item.age}</span>
              </p>
              <p className="mt-1 truncate text-sm text-ink-muted">{item.symptom}</p>
            </div>
            <span
              className={`shrink-0 text-[0.625rem] font-semibold tracking-[0.14em] uppercase ${item.tone}`}
            >
              {item.level}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 border-t border-ink-line">
        {[
          {
            value: String(
              demoConsultations.filter((item) => item.status === "PENDENTE").length,
            ),
            label: "Pendentes",
          },
          {
            value: String(
              demoConsultations.filter((item) => item.status === "AGENDADA").length,
            ),
            label: "Agendadas",
          },
          {
            value: String(
              demoConsultations.filter((item) => item.status === "EM_CURSO").length,
            ),
            label: "Em curso",
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`px-5 py-4 ${index > 0 ? "border-l border-ink-line" : ""}`}
          >
            <p className="font-heading text-xl font-extrabold tabular-nums">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[0.5625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const specification = [
  { term: "Canal offline", detail: "USSD sobre GSM, sem dados móveis" },
  { term: "Teleconsulta", detail: "Vídeo e voz sobre WebRTC" },
  { term: "Interoperabilidade", detail: "Preparado para FHIR R4 e HL7 v2" },
  { term: "Controlo de acesso", detail: "Perfis de encarregado, pediatra e administração" },
  { term: "Auditoria", detail: "Registo de actividade por pedido clínico" },
  { term: "Cobertura", detail: "Cidade de Maputo, crianças dos 0 aos 15 anos" },
];

function Specification() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8 lg:py-16">
        <p className="text-[0.6875rem] tracking-[0.2em] text-muted-foreground font-semibold uppercase">
          Ficha técnica
        </p>

        <dl className="mt-8 grid gap-x-12 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {specification.map((item) => (
            <div key={item.term} className="border-b border-border py-4">
              <dt className="text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
                {item.term}
              </dt>
              <dd className="mt-1.5 text-sm font-medium">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ClosingCall() {
  return (
    <section className="bg-paper">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-[-0.035em] text-balance sm:text-5xl">
            A sua criança tem febre agora. Comece por aqui.
          </h2>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="rounded-lg">
              <Link href="/registo">
                Criar conta
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="rounded-lg">
              <Link href="/ussd">Ver o canal USSD</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

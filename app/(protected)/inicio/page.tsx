"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Baby,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Hospital,
  Inbox,
  Plus,
  Smartphone,
  Stethoscope,
  Users,
} from "lucide-react";

import {
  PriorityChart,
  StageChart,
  VolumeChart,
} from "@/components/dashboard/clinic-charts";
import { NextConsultation } from "@/components/dashboard/next-consultation";
import { PriorityQueue } from "@/components/dashboard/priority-queue";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayAgenda } from "@/components/dashboard/today-agenda";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { accessLevelFor, maskConsultation } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { openStatuses } from "@/lib/types/consultation";
import {
  getMetrics,
  getNextConsultation,
  getPriorityCases,
  sortByCreatedDesc,
} from "@/lib/utils/consultations";
import { describeAge, formatDateTime, timeAgo } from "@/lib/utils/date";

export default function InicioPage() {
  const user = useSession();
  const consultations = useClinicStore((state) => state.consultations);
  const children = useClinicStore((state) => state.children);

  if (user.role === "ENCARREGADO") {
    return (
      <GuardianHome
        consultations={consultations.filter(
          (item) => item.guardianId === user.id || item.phone === user.phone,
        )}
        childCount={
          children.filter(
            (child) => child.guardianId === user.id && !child.archived,
          ).length
        }
      />
    );
  }

  // O painel clínico é uma vista de conjunto: os casos de outros pediatras
  // entram nas contagens e nas filas, mas sem identificação nem contactos.
  const scoped = consultations.map((item) =>
    maskConsultation(item, accessLevelFor(user, item)),
  );

  return <ClinicalHome consultations={scoped} isAdmin={user.role === "ADMIN"} />;
}

// --- Painel do encarregado -------------------------------------------------

function GuardianHome({
  consultations,
  childCount,
}: {
  consultations: ReturnType<typeof useClinicStore.getState>["consultations"];
  childCount: number;
}) {
  const user = useSession();
  const children = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id && !child.archived,
  );

  const open = consultations.filter((item) => openStatuses.includes(item.status));
  const recent = sortByCreatedDesc(consultations).slice(0, 5);
  const next = getNextConsultation(consultations);
  const emergencies = consultations.filter(
    (item) => item.priority === "CRITICA" && item.status === "ENCAMINHADA",
  );

  return (
    <>
      <AppHeader
        user={user}
        title={`Olá, ${user.name.split(" ")[0]}`}
        subtitle="Acompanhe os pedidos de teleconsulta da sua família."
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/teleconsultas/novo">
              <Plus data-icon="inline-start" />
              Novo pedido
            </Link>
          </Button>
        }
      />

      <PageShell>
        {emergencies.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Encaminhamento para unidade sanitária</AlertTitle>
            <AlertDescription>
              {emergencies.length === 1
                ? `O pedido ${emergencies[0].reference} foi classificado como emergência. Dirija-se imediatamente à unidade de saúde mais próxima.`
                : `${emergencies.length} pedidos foram classificados como emergência. Dirija-se imediatamente à unidade de saúde mais próxima.`}
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos em aberto"
            value={open.length}
            icon={ClipboardList}
            tone="primary"
            hint="Pendentes, agendados ou em curso"
          />
          <StatCard
            label="Crianças registadas"
            value={childCount}
            icon={Baby}
            tone="success"
          />
          <StatCard
            label="Consultas concluídas"
            value={consultations.filter((item) => item.status === "CONCLUIDA").length}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Encaminhamentos"
            value={consultations.filter((item) => item.status === "ENCAMINHADA").length}
            icon={Hospital}
            tone="danger"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <h2 className="font-bold tracking-tight">Pedidos recentes</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/teleconsultas">Ver todos</Link>
                </Button>
              </div>

              {recent.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Inbox className="size-5" />}
                    title="Ainda não submeteu pedidos"
                    description="Solicite a primeira teleconsulta pediátrica para uma das suas crianças."
                    action={
                      <Button asChild size="lg">
                        <Link href="/teleconsultas/novo">
                          <Plus data-icon="inline-start" />
                          Solicitar teleconsulta
                        </Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/teleconsultas/${item.id}`}
                        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{item.childName}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {[...item.symptoms, item.otherSymptom]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {item.reference} · {timeAgo(item.createdAt)}
                            {item.scheduledAt
                              ? ` · Marcada para ${formatDateTime(item.scheduledAt)}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          <PriorityBadge priority={item.priority} />
                          <StatusBadge status={item.status} />
                          <ChannelBadge channel={item.channel} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <h2 className="font-bold tracking-tight">As minhas crianças</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/criancas">Gerir</Link>
                </Button>
              </div>

              {children.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Baby className="size-5" />}
                    title="Nenhuma criança registada"
                    description="Cadastre a sua criança para poder solicitar teleconsultas."
                    action={
                      <Button asChild size="lg">
                        <Link href="/criancas">Cadastrar criança</Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-foreground">
                          {child.name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{child.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {describeAge(child.birthDate)} ·{" "}
                            {child.sex === "M" ? "Masculino" : "Feminino"}
                          </p>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm">
                        <Link href={`/teleconsultas/novo?crianca=${child.id}`}>
                          Solicitar
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <NextConsultation consultation={next} />

            <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Smartphone className="size-4" />
              </span>
              <h3 className="mt-3.5 font-bold tracking-tight">Sem internet?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Marque <span className="font-ussd font-semibold text-foreground">*123#</span>{" "}
                no seu telemóvel para submeter um pedido pelo canal USSD.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4 w-full">
                <Link href="/ussd">Abrir simulador</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

// --- Painel clínico (pediatra / administração) -----------------------------

function ClinicalHome({
  consultations,
  isAdmin,
}: {
  consultations: ReturnType<typeof useClinicStore.getState>["consultations"];
  isAdmin: boolean;
}) {
  const user = useSession();
  const metrics = getMetrics(consultations);
  const priorityCases = getPriorityCases(consultations);
  const next = getNextConsultation(consultations);

  return (
    <>
      <AppHeader
        user={user}
        title="Início"
        subtitle={
          isAdmin
            ? "Visão institucional da telepediatria do HGM."
            : "Fila de triagem, agenda do dia e casos prioritários."
        }
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/teleconsultas">
              <Stethoscope data-icon="inline-start" />
              Fila de triagem
            </Link>
          </Button>
        }
      />

      <PageShell>
        {metrics.criticalOpen > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>
              {metrics.criticalOpen} caso{metrics.criticalOpen > 1 ? "s" : ""} crítico
              {metrics.criticalOpen > 1 ? "s" : ""} em aberto
            </AlertTitle>
            <AlertDescription>
              A triagem automática encaminhou estes pedidos para atendimento
              presencial imediato. Confirme o contacto com o encarregado.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos pendentes"
            value={metrics.pending}
            icon={Inbox}
            tone="warning"
            hint="Ainda sem horário definido"
          />
          <StatCard
            label="Agendadas"
            value={metrics.scheduled}
            icon={CalendarCheck2}
            tone="primary"
          />
          <StatCard
            label="Em curso"
            value={metrics.inProgress}
            icon={Activity}
            tone="success"
          />
          <StatCard
            label="Consultas hoje"
            value={metrics.today}
            icon={Users}
            hint={`${metrics.todayUpcoming} ainda por realizar`}
          />
        </section>

        {/*
          Leitura de conjunto antes das listas: como tem corrido a semana, o
          que está à espera de decisão clínica e em que ponto do percurso estão
          os pedidos. Os mesmos gráficos servem o pediatra e a administração.
        */}
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8 xl:col-span-2">
            <h2 className="font-bold tracking-tight">
              Pedidos nos últimos 7 dias
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Altura da coluna é o total do dia; a base assinala os que
              entraram como urgentes ou críticos.
            </p>
            <div className="mt-4">
              <VolumeChart data={consultations} />
            </div>
          </article>

          <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <h2 className="font-bold tracking-tight">Fila por gravidade</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Classificação atribuída pela triagem automática.
            </p>
            <div className="mt-4">
              <PriorityChart data={consultations} />
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <h2 className="font-bold tracking-tight">Percurso dos pedidos</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Do pedido recebido ao caso encerrado. A barra completa corresponde
            ao total de pedidos registados.
          </p>
          <div className="mt-4">
            <StageChart data={consultations} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PriorityQueue data={priorityCases} />
          </div>
          <NextConsultation consultation={next} />
        </section>

        <TodayAgenda data={consultations} />
      </PageShell>
    </>
  );
}

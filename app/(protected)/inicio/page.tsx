"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Baby,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Hospital,
  Inbox,
  Plus,
  Smartphone,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

import {
  PriorityChart,
  StageChart,
  VolumeChart,
} from "@/components/dashboard/clinic-charts";
import { NextConsultation } from "@/components/dashboard/next-consultation";
import { RequestQueue } from "@/components/dashboard/request-queue";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayAgenda } from "@/components/dashboard/today-agenda";
import { AppHeader } from "@/components/layout/app-header";
import { EmergencyNotice } from "@/components/layout/emergency-notice";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { AvailabilityBadge } from "@/components/telemedicine/availability-badge";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { accessLevelFor, isOwnRequest, maskConsultation } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useAvailability, usePediatricians } from "@/lib/store/selectors";
import type { Consultation } from "@/lib/types/consultation";
import { openStatuses } from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { roleResponsibilities } from "@/lib/types/user";
import {
  doctorAvailabilityStatus,
  rankDoctorsByAvailability,
} from "@/lib/utils/availability";
import {
  getAssignmentQueue,
  getMetrics,
  getNextConsultation,
  getPriorityCases,
  getSchedulingQueue,
  getTriageQueue,
  primaryActionFor,
  sortByCreatedDesc,
  symptomText,
} from "@/lib/utils/consultations";
import { describeAge, formatDateTime, timeAgo } from "@/lib/utils/date";

/**
 * Painel inicial.
 *
 * Há um painel por perfil, com a fila de trabalho que lhe pertence e uma área de
 * notificações (§9 do relatório). Nenhum painel mostra mais do que o perfil está
 * autorizado a ver.
 */
export default function InicioPage() {
  const user = useSession();
  const consultations = useClinicStore((state) => state.consultations);
  const children = useClinicStore((state) => state.children);

  if (user.role === "ENCARREGADO") {
    return (
      <GuardianHome
        consultations={consultations.filter((item) => isOwnRequest(user, item))}
        childCount={
          children.filter(
            (child) => child.guardianId === user.id && !child.archived,
          ).length
        }
      />
    );
  }

  // Os casos de outros profissionais entram nas contagens e nas filas, mas com a
  // identificação e os contactos reduzidos ao necessário.
  const scoped = consultations.map((item) =>
    maskConsultation(item, accessLevelFor(user, item)),
  );

  if (user.role === "TRIAGEM") return <TriageHome consultations={scoped} />;
  if (user.role === "ADMINISTRATIVO") {
    return <AdministrativeHome consultations={scoped} />;
  }
  return <DoctorHome consultations={scoped} />;
}

// --- Painel do encarregado -------------------------------------------------

function GuardianHome({
  consultations,
  childCount,
}: {
  consultations: Consultation[];
  childCount: number;
}) {
  const user = useSession();
  const children = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id && !child.archived,
  );

  const open = consultations.filter((item) => openStatuses.includes(item.status));
  const recent = sortByCreatedDesc(consultations).slice(0, 5);
  const next = getNextConsultation(consultations);
  const referred = consultations.filter(
    (item) => item.status === "ENCAMINHADO_PRESENCIAL",
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
        {referred.some((item) => item.priority === "CRITICA") ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Encaminhamento para unidade sanitária</AlertTitle>
            <AlertDescription>
              A triagem do HGM encaminhou um dos seus pedidos para atendimento
              presencial. Consulte o pedido para ver o motivo indicado.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos em aberto"
            value={open.length}
            icon={ClipboardList}
            tone="primary"
            hint="Em triagem, atribuição, agendamento ou consulta"
          />
          <StatCard
            label="Crianças registadas"
            value={childCount}
            icon={Baby}
            tone="success"
          />
          <StatCard
            label="Consultas concluídas"
            value={
              consultations.filter((item) => item.status === "CONSULTA_CONCLUIDA")
                .length
            }
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Encaminhamentos"
            value={referred.length}
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
                        href={`/teleconsultas/${item.id}?tab=${primaryActionFor(user, item).tab}`}
                        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{item.childName}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {symptomText(item)}
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

            <NotificationsPanel user={user} />

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
                    description="Registe a sua criança para poder solicitar teleconsultas."
                    action={
                      <Button asChild size="lg">
                        <Link href="/criancas">Registar criança</Link>
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
            <EmergencyNotice />

            <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Smartphone className="size-4" />
              </span>
              <h3 className="mt-3.5 font-bold tracking-tight">
                Sem acesso à Internet?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Veja como seria a solicitação de uma teleconsulta através do
                Simulador USSD.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4 w-full">
                <Link href="/ussd">Abrir Simulador USSD</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

// --- Painel do profissional de triagem -------------------------------------

function TriageHome({ consultations }: { consultations: Consultation[] }) {
  const user = useSession();
  const metrics = getMetrics(consultations);
  const queue = getTriageQueue(consultations);
  const triagedByMe = consultations.filter(
    (item) => item.triageProfessionalId === user.id,
  );

  return (
    <>
      <AppHeader
        user={user}
        title="Triagem"
        subtitle="Pedidos submetidos à espera de análise e classificação."
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/triagem">
              <ClipboardCheck data-icon="inline-start" />
              Fila de triagem
            </Link>
          </Button>
        }
      />

      <PageShell>
        <RoleNotice role="TRIAGEM" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Aguardando triagem"
            value={metrics.awaitingTriage}
            icon={Inbox}
            tone="warning"
            hint="Pedidos por analisar"
          />
          <StatCard
            label="Triados por mim"
            value={triagedByMe.length}
            icon={ClipboardCheck}
            tone="primary"
          />
          <StatCard
            label="Críticos em aberto"
            value={metrics.criticalOpen}
            icon={AlertTriangle}
            tone="danger"
          />
          <StatCard
            label="Urgentes em aberto"
            value={metrics.urgentOpen}
            icon={Activity}
            tone="warning"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RequestQueue
              title="Pedidos por triar"
              description="Por ordem de chegada. Analise os sintomas e atribua a prioridade."
              data={queue}
              viewer={user}
              href="/triagem"
              emptyTitle="Fila de triagem vazia"
              emptyDescription="Todos os pedidos submetidos já foram analisados."
            />

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">
                Pedidos nos últimos 7 dias
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Altura da coluna é o total do dia; a base assinala os que a triagem
                classificou como urgentes ou críticos.
              </p>
              <div className="mt-4">
                <VolumeChart data={consultations} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <NotificationsPanel user={user} />
            <EmergencyNotice />
          </div>
        </section>
      </PageShell>
    </>
  );
}

// --- Painel administrativo -------------------------------------------------

function AdministrativeHome({ consultations }: { consultations: Consultation[] }) {
  const user = useSession();
  const pediatricians = usePediatricians();
  const availability = useAvailability();

  const metrics = getMetrics(consultations);
  const toAssign = getAssignmentQueue(consultations);
  const toSchedule = getSchedulingQueue(consultations);
  const ranked = rankDoctorsByAvailability(pediatricians, availability);
  const availableNow = ranked.filter((entry) => entry.available).length;

  return (
    <>
      <AppHeader
        user={user}
        title="Gestão de pedidos"
        subtitle="Pedidos triados à espera de pediatra, disponibilidade e estado do serviço."
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/teleconsultas">
              <Stethoscope data-icon="inline-start" />
              Ver pedidos
            </Link>
          </Button>
        }
      />

      <PageShell>
        <RoleNotice role="ADMINISTRATIVO" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Por atribuir"
            value={metrics.awaitingAssignment}
            icon={UserCheck}
            tone="warning"
            hint="Triados, à espera de pediatra"
          />
          <StatCard
            label="Por agendar"
            value={metrics.awaitingScheduling}
            icon={CalendarClock}
            tone="primary"
          />
          <StatCard
            label="Agendadas"
            value={metrics.scheduled}
            icon={CalendarCheck2}
            tone="primary"
          />
          <StatCard
            label="Pediatras disponíveis"
            value={`${availableNow} / ${pediatricians.length}`}
            icon={Users}
            tone={availableNow > 0 ? "success" : "danger"}
            hint="Dentro do turno ou com disponibilidade adicional"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RequestQueue
              title="Pedidos por atribuir"
              description="Triados pela equipa de saúde e à espera de um pediatra."
              data={toAssign}
              viewer={user}
              emptyTitle="Nada por atribuir"
              emptyDescription="Todos os pedidos triados já têm pediatra responsável."
            />

            <RequestQueue
              title="Atribuídos, à espera de horário"
              description="O pediatra responsável define ou confirma a data e a hora."
              data={toSchedule}
              viewer={user}
              emptyTitle="Nada à espera de horário"
              emptyDescription="Todos os pedidos atribuídos já têm horário definido."
            />

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Percurso dos pedidos</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Do pedido submetido ao caso encerrado. A barra completa corresponde
                ao total de pedidos registados.
              </p>
              <div className="mt-4">
                <StageChart data={consultations} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <NotificationsPanel user={user} />

            <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-bold tracking-tight">Disponibilidade</h2>
                  <p className="text-xs text-muted-foreground">
                    Situação de cada pediatra neste momento
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/disponibilidade">Ver escala</Link>
                </Button>
              </div>

              <ul className="divide-y divide-border">
                {ranked.map((entry) => (
                  <li
                    key={entry.doctor.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {entry.doctor.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.doctor.specialty ?? "Pediatria"}
                      </p>
                    </div>
                    <AvailabilityBadge status={entry.status} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>

        <TodayAgenda data={consultations} viewer={user} />
      </PageShell>
    </>
  );
}

// --- Painel do pediatra ----------------------------------------------------

function DoctorHome({ consultations }: { consultations: Consultation[] }) {
  const user = useSession();
  const availability = useAvailability();

  const mine = consultations.filter((item) => item.assignedDoctorId === user.id);
  const metrics = getMetrics(mine);
  const next = getNextConsultation(mine);
  const toReview = mine.filter((item) => item.status === "PEDIATRA_ATRIBUIDO");
  const toSchedule = mine.filter(
    (item) => item.status === "AGUARDA_AGENDAMENTO",
  );
  const priorityCases = getPriorityCases(mine);
  const status = doctorAvailabilityStatus(user, availability);

  return (
    <>
      <AppHeader
        user={user}
        title="Início"
        subtitle="Pedidos atribuídos a si, agenda do dia e casos prioritários."
        actions={
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/teleconsultas">
              <Stethoscope data-icon="inline-start" />
              Os meus pedidos
            </Link>
          </Button>
        }
      />

      <PageShell>
        <RoleNotice role="PEDIATRA" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Por analisar"
            value={toReview.length}
            icon={Inbox}
            tone="warning"
            hint="Pedidos atribuídos ainda por abrir"
          />
          <StatCard
            label="Por agendar"
            value={toSchedule.length}
            icon={CalendarClock}
            tone="primary"
          />
          <StatCard
            label="Agendadas"
            value={metrics.scheduled}
            icon={CalendarCheck2}
            tone="primary"
          />
          <StatCard
            label="Consultas hoje"
            value={metrics.today}
            icon={Users}
            hint={`${metrics.todayUpcoming} ainda por realizar`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RequestQueue
              title="Pedidos atribuídos a si"
              description="Consulte a triagem, defina o horário e realize a teleconsulta."
              data={[...toReview, ...toSchedule]}
              viewer={user}
              emptyTitle="Nenhum pedido por tratar"
              emptyDescription="O perfil administrativo atribui os pedidos depois da triagem."
            />

            {priorityCases.length > 0 ? (
              <RequestQueue
                title="Casos prioritários"
                description="Pedidos classificados como urgentes ou críticos pela triagem."
                data={priorityCases}
                viewer={user}
              />
            ) : null}

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">
                Pedidos por prioridade atribuída
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Classificação atribuída pelo profissional de triagem.
              </p>
              <div className="mt-4">
                <PriorityChart data={mine} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <NextConsultation consultation={next} />

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold tracking-tight">A sua disponibilidade</h2>
                <AvailabilityBadge status={status} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A disponibilidade depende do turno registado, da disponibilidade que
                declarar e das ausências — um pediatra nunca aparece disponível fora
                do seu turno sem uma disponibilidade adicional registada.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4 w-full">
                <Link href="/disponibilidade">Gerir disponibilidade</Link>
              </Button>
            </section>

            <NotificationsPanel user={user} />
          </div>
        </section>

        <TodayAgenda data={mine} viewer={user} />
      </PageShell>
    </>
  );
}

/** Lembrete das responsabilidades do perfil — o que pode e o que não pode. */
function RoleNotice({ role }: { role: User["role"] }) {
  return (
    <Alert variant="info">
      <ClipboardCheck />
      <AlertTitle>O seu perfil</AlertTitle>
      <AlertDescription>{roleResponsibilities[role]}</AlertDescription>
    </Alert>
  );
}

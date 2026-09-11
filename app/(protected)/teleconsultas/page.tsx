"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  ClipboardCheck,
  Inbox,
  Layers,
  ListFilter,
  Lock,
  Plus,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ConsultationFiltersBar } from "@/components/telemedicine/consultation-filters";
import { ConsultationsTable } from "@/components/telemedicine/consultations-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  accessLevelFor,
  isAssignedTo,
  isInAssignmentQueue,
  isInTriageQueue,
  maskConsultation,
  visibleConsultations,
} from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { openStatuses } from "@/lib/types/consultation";
import type { Consultation } from "@/lib/types/consultation";
import type { UserRole } from "@/lib/types/user";
import {
  defaultFilters,
  filterConsultations,
  getMetrics,
  sortByArrival,
  sortByCreatedDesc,
  sortByPriority,
  type ConsultationFilters,
} from "@/lib/utils/consultations";
import { cn } from "@/lib/utils";

/**
 * Âmbito da listagem, por perfil.
 *
 * Cada profissional começa pela fila que é sua: o de triagem pelos pedidos por
 * triar, o administrativo pelos pedidos por atribuir e o pediatra pelos pedidos
 * que lhe foram atribuídos. A vista do serviço continua disponível — a
 * coordenação precisa dela — mas com os dados pessoais reduzidos.
 */
type Scope = { value: string; label: string; icon: typeof Inbox };

const scopesByRole: Partial<Record<UserRole, Scope[]>> = {
  TRIAGEM: [
    { value: "FILA", label: "Por triar", icon: ClipboardCheck },
    { value: "MEUS", label: "Triados por mim", icon: Stethoscope },
    { value: "TODOS", label: "Todo o serviço", icon: Layers },
  ],
  ADMINISTRATIVO: [
    { value: "ATRIBUIR", label: "Por atribuir", icon: UserCheck },
    { value: "ABERTOS", label: "Em curso no serviço", icon: Activity },
    { value: "TODOS", label: "Todos os pedidos", icon: Layers },
  ],
  PEDIATRA: [
    { value: "MEUS", label: "Atribuídos a mim", icon: Stethoscope },
    { value: "TODOS", label: "Serviço (dados reservados)", icon: Layers },
  ],
};

export default function TeleconsultasPage() {
  const user = useSession();
  const allConsultations = useClinicStore((state) => state.consultations);
  const [filters, setFilters] = useState<ConsultationFilters>(defaultFilters);

  const scopes = scopesByRole[user.role] ?? [];
  const [scope, setScope] = useState<string>(scopes[0]?.value ?? "TODOS");

  const isGuardian = user.role === "ENCARREGADO";

  // 1. o que o perfil pode ver de todo
  const visible = useMemo(
    () => visibleConsultations(user, allConsultations),
    [user, allConsultations],
  );

  // 2. o âmbito escolhido
  const scoped = useMemo(
    () => applyScope(visible, user.role, user.id, scope),
    [visible, user.role, user.id, scope],
  );

  // 3. o detalhe que pode ser mostrado em cada linha
  const scopedForDisplay = useMemo(
    () => scoped.map((item) => maskConsultation(item, accessLevelFor(user, item))),
    [scoped, user],
  );

  const filtered = useMemo(() => {
    const result = filterConsultations(scopedForDisplay, filters);

    // A triagem trabalha por ordem de chegada; as restantes filas pela
    // prioridade atribuída; a família prefere a ordem cronológica.
    if (isGuardian) return sortByCreatedDesc(result);
    if (user.role === "TRIAGEM" && scope === "FILA") return sortByArrival(result);
    return sortByPriority(result);
  }, [scopedForDisplay, filters, isGuardian, user.role, scope]);

  const metrics = useMemo(() => getMetrics(filtered), [filtered]);

  const counts = useMemo(
    () => ({
      FILA: visible.filter(isInTriageQueue).length,
      ATRIBUIR: visible.filter(isInAssignmentQueue).length,
      MEUS:
        user.role === "PEDIATRA"
          ? visible.filter((item) => isAssignedTo(item, user.id)).length
          : visible.filter((item) => item.triageProfessionalId === user.id).length,
      ABERTOS: visible.filter((item) => openStatuses.includes(item.status)).length,
      TODOS: visible.length,
    }),
    [visible, user.role, user.id],
  );

  return (
    <>
      <AppHeader
        user={user}
        title={isGuardian ? "Os meus pedidos" : "Teleconsultas"}
        subtitle={subtitleFor(user.role)}
        actions={
          isGuardian ? (
            <Button asChild size="lg" className="hidden sm:inline-flex">
              <Link href="/teleconsultas/novo">
                <Plus data-icon="inline-start" />
                Novo pedido
              </Link>
            </Button>
          ) : null
        }
      />

      <PageShell>
        {user.role === "ADMINISTRATIVO" ? (
          <Alert variant="info">
            <Lock />
            <AlertTitle>Perfil administrativo</AlertTitle>
            <AlertDescription>
              Tem acesso aos dados necessários à gestão do serviço: organizar
              pedidos, consultar a disponibilidade, atribuir pediatras e acompanhar
              o estado. A triagem, as notas clínicas e as prescrições pertencem aos
              profissionais de saúde envolvidos no atendimento.
            </AlertDescription>
          </Alert>
        ) : null}

        {scopes.length > 0 ? (
          <div
            role="tablist"
            aria-label="Âmbito dos pedidos"
            className="flex flex-wrap gap-2"
          >
            {scopes.map((tab) => {
              const active = scope === tab.value;
              const count = counts[tab.value as keyof typeof counts] ?? 0;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(tab.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ring-1 transition-colors",
                    active
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-muted-foreground ring-border hover:text-foreground",
                  )}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs font-bold tabular-nums",
                      active ? "bg-white/20" : "bg-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {user.role === "PEDIATRA" && scope === "TODOS" ? (
          <Alert variant="info">
            <Lock />
            <AlertTitle>Identificação reservada</AlertTitle>
            <AlertDescription>
              Nos casos atribuídos a outros pediatras vê apenas a referência, a
              idade e o quadro clínico resumido. Para aceder ao processo completo —
              substituição, apoio clínico ou encaminhamento interno — abra o pedido
              e justifique o acesso; o registo fica guardado para auditoria.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total filtrado" value={filtered.length} icon={ListFilter} />
          <StatCard
            label="Aguardando triagem"
            value={metrics.awaitingTriage}
            icon={ClipboardCheck}
            tone="warning"
          />
          <StatCard
            label="Agendadas"
            value={metrics.scheduled}
            icon={CalendarCheck2}
            tone="primary"
          />
          <StatCard
            label={isGuardian ? "Em curso" : "Casos críticos em aberto"}
            value={isGuardian ? metrics.inProgress : metrics.criticalOpen}
            icon={isGuardian ? Activity : AlertTriangle}
            tone={isGuardian ? "success" : "danger"}
          />
        </section>

        <ConsultationFiltersBar filters={filters} onChange={setFilters} />

        <ConsultationsTable
          data={filtered}
          viewer={user}
          emptyDescription={emptyDescriptionFor(user.role, scope)}
        />
      </PageShell>
    </>
  );
}

function applyScope(
  data: Consultation[],
  role: UserRole,
  userId: string,
  scope: string,
) {
  if (role === "TRIAGEM") {
    if (scope === "FILA") return data.filter(isInTriageQueue);
    if (scope === "MEUS") {
      return data.filter((item) => item.triageProfessionalId === userId);
    }
    return data;
  }

  if (role === "ADMINISTRATIVO") {
    if (scope === "ATRIBUIR") return data.filter(isInAssignmentQueue);
    if (scope === "ABERTOS") {
      return data.filter((item) => openStatuses.includes(item.status));
    }
    return data;
  }

  if (role === "PEDIATRA") {
    if (scope === "MEUS") return data.filter((item) => isAssignedTo(item, userId));
    return data;
  }

  return data;
}

function subtitleFor(role: UserRole) {
  switch (role) {
    case "ENCARREGADO":
      return "Todos os pedidos submetidos pela sua família.";
    case "TRIAGEM":
      return "Pedidos por triar e pedidos que já analisou.";
    case "ADMINISTRATIVO":
      return "Organização dos pedidos, atribuição de pediatras e acompanhamento do estado.";
    default:
      return "Pedidos atribuídos a si e actividade do serviço.";
  }
}

function emptyDescriptionFor(role: UserRole, scope: string) {
  if (role === "TRIAGEM" && scope === "FILA") {
    return "A fila de triagem está vazia: todos os pedidos submetidos já foram analisados.";
  }
  if (role === "ADMINISTRATIVO" && scope === "ATRIBUIR") {
    return "Não há pedidos triados à espera de pediatra.";
  }
  if (role === "PEDIATRA" && scope === "MEUS") {
    return "Não tem pedidos atribuídos. O perfil administrativo atribui os pedidos depois da triagem.";
  }
  return undefined;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  Inbox,
  Layers,
  ListFilter,
  Lock,
  Plus,
  Stethoscope,
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
  isInTriageQueue,
  maskConsultation,
  visibleConsultations,
} from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import {
  defaultFilters,
  filterConsultations,
  getMetrics,
  sortByCreatedDesc,
  sortByTriage,
  type ConsultationFilters,
} from "@/lib/utils/consultations";
import { cn } from "@/lib/utils";

/**
 * Âmbito da listagem para um pediatra.
 *
 * O relatório de testes assinalou que qualquer pediatra via todas as
 * teleconsultas do sistema, com contactos e notas clínicas incluídos. A fila
 * geral passa a mostrar apenas o que é preciso para assumir um caso; o
 * processo completo fica com o profissional responsável.
 */
type Scope = "FILA" | "MINHAS" | "TODAS";

const scopeTabs: { value: Scope; label: string; icon: typeof Inbox }[] = [
  { value: "FILA", label: "Fila de triagem", icon: Inbox },
  { value: "MINHAS", label: "As minhas teleconsultas", icon: Stethoscope },
  { value: "TODAS", label: "Serviço (dados reservados)", icon: Layers },
];

export default function TeleconsultasPage() {
  const user = useSession();
  const allConsultations = useClinicStore((state) => state.consultations);
  const [filters, setFilters] = useState<ConsultationFilters>(defaultFilters);
  const [scope, setScope] = useState<Scope>("FILA");

  const isGuardian = user.role === "ENCARREGADO";
  const isPediatrician = user.role === "PEDIATRA";

  // 1. o que o perfil pode ver de todo
  const visible = useMemo(
    () => visibleConsultations(user, allConsultations),
    [user, allConsultations],
  );

  // 2. o âmbito escolhido pelo pediatra
  const scoped = useMemo(() => {
    if (!isPediatrician) return visible;

    if (scope === "FILA") return visible.filter(isInTriageQueue);
    if (scope === "MINHAS")
      return visible.filter((item) => isAssignedTo(item, user.id));
    return visible;
  }, [visible, isPediatrician, scope, user.id]);

  // 3. o detalhe que pode ser mostrado em cada linha
  const scopedForDisplay = useMemo(
    () =>
      scoped.map((item) => maskConsultation(item, accessLevelFor(user, item))),
    [scoped, user],
  );

  const filtered = useMemo(() => {
    const result = filterConsultations(scopedForDisplay, filters);
    // O pediatra precisa da fila por gravidade; a família prefere a ordem
    // cronológica dos seus pedidos.
    return isGuardian ? sortByCreatedDesc(result) : sortByTriage(result);
  }, [scopedForDisplay, filters, isGuardian]);

  const metrics = useMemo(() => getMetrics(filtered), [filtered]);

  const queueCount = useMemo(
    () => visible.filter(isInTriageQueue).length,
    [visible],
  );
  const mineCount = useMemo(
    () => visible.filter((item) => isAssignedTo(item, user.id)).length,
    [visible, user.id],
  );

  return (
    <>
      <AppHeader
        user={user}
        title={isGuardian ? "Os meus pedidos" : "Teleconsultas"}
        subtitle={
          isGuardian
            ? "Todos os pedidos submetidos pela sua família."
            : isPediatrician
              ? "Fila de triagem por assumir e as teleconsultas à sua responsabilidade."
              : "Actividade do serviço, sem conteúdo clínico detalhado."
        }
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
        {user.role === "ADMIN" ? (
          <Alert variant="info">
            <Lock />
            <AlertTitle>Perfil de administração</AlertTitle>
            <AlertDescription>
              Tem acesso aos dados necessários à gestão do serviço e aos
              relatórios institucionais. As notas clínicas, a orientação e os
              anexos dos pedidos estão reservados aos profissionais envolvidos
              no atendimento.
            </AlertDescription>
          </Alert>
        ) : null}

        {isPediatrician ? (
          <>
            <div
              role="tablist"
              aria-label="Âmbito das teleconsultas"
              className="flex flex-wrap gap-2"
            >
              {scopeTabs.map((tab) => {
                const active = scope === tab.value;
                const count =
                  tab.value === "FILA"
                    ? queueCount
                    : tab.value === "MINHAS"
                      ? mineCount
                      : visible.length;

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

            {scope === "TODAS" ? (
              <Alert variant="info">
                <Lock />
                <AlertTitle>Identificação reservada</AlertTitle>
                <AlertDescription>
                  Nos casos atribuídos a outros pediatras vê apenas a
                  referência, a idade e o quadro clínico resumido. Para aceder
                  ao processo completo — substituição, apoio clínico ou
                  encaminhamento interno — abra o pedido e justifique o acesso;
                  o registo fica guardado para auditoria.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total filtrado"
            value={
              metrics.pending +
              metrics.scheduled +
              metrics.inProgress +
              metrics.completed +
              metrics.referred
            }
            icon={ListFilter}
          />
          <StatCard
            label="Pendentes"
            value={metrics.pending}
            icon={Inbox}
            tone="warning"
          />
          <StatCard
            label="Agendadas"
            value={metrics.scheduled}
            icon={CalendarCheck2}
            tone="primary"
          />
          <StatCard
            label={isGuardian ? "Em curso" : "Casos críticos"}
            value={isGuardian ? metrics.inProgress : metrics.critical}
            icon={isGuardian ? Activity : AlertTriangle}
            tone={isGuardian ? "success" : "danger"}
          />
        </section>

        <ConsultationFiltersBar filters={filters} onChange={setFilters} />

        <ConsultationsTable
          data={filtered}
          emptyDescription={
            isPediatrician && scope === "FILA"
              ? "A fila de triagem está vazia: todos os pedidos já têm pediatra responsável."
              : undefined
          }
        />
      </PageShell>
    </>
  );
}

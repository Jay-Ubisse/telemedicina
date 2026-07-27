"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  Inbox,
  ListFilter,
  Plus,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ConsultationFiltersBar } from "@/components/telemedicine/consultation-filters";
import { ConsultationsTable } from "@/components/telemedicine/consultations-table";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store/clinic-store";
import {
  defaultFilters,
  filterConsultations,
  getMetrics,
  sortByCreatedDesc,
  sortByTriage,
  type ConsultationFilters,
} from "@/lib/utils/consultations";

export default function TeleconsultasPage() {
  const user = useSession();
  const allConsultations = useClinicStore((state) => state.consultations);
  const [filters, setFilters] = useState<ConsultationFilters>(defaultFilters);

  const isGuardian = user.role === "ENCARREGADO";

  // Um encarregado só vê os pedidos da sua própria família.
  const scoped = useMemo(
    () =>
      isGuardian
        ? allConsultations.filter(
            (item) => item.guardianId === user.id || item.phone === user.phone,
          )
        : allConsultations,
    [allConsultations, isGuardian, user.id, user.phone],
  );

  const filtered = useMemo(() => {
    const result = filterConsultations(scoped, filters);
    // O pediatra precisa da fila por gravidade; a família prefere a ordem
    // cronológica dos seus pedidos.
    return isGuardian ? sortByCreatedDesc(result) : sortByTriage(result);
  }, [scoped, filters, isGuardian]);

  const metrics = useMemo(() => getMetrics(filtered), [filtered]);

  return (
    <>
      <AppHeader
        user={user}
        title={isGuardian ? "Os meus pedidos" : "Teleconsultas"}
        subtitle={
          isGuardian
            ? "Todos os pedidos submetidos pela sua família."
            : "Fila de triagem ordenada por gravidade e hora de chegada."
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total filtrado"
            value={metrics.pending + metrics.scheduled + metrics.inProgress + metrics.completed + metrics.referred}
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

        <ConsultationsTable data={filtered} />
      </PageShell>
    </>
  );
}

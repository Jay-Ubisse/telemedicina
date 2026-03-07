"use client";

import { useMemo, useState } from "react";
import { Activity, CalendarCheck2, HeartPulse, ListFilter } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { OverviewCard } from "@/components/telemedicine/overview-card";
import { TeleconsultationsFilters } from "@/components/telemedicine/teleconsultations-filters";
import { TeleconsultationsTable } from "@/components/telemedicine/teleconsultations-table";
import { useTelemedicineStore } from "@/lib/store/telemedicine-store";
import {
  filterTeleconsultations,
  getTeleconsultationOverview,
  sortTeleconsultationsByDate,
  type TeleconsultationFilters,
} from "@/lib/utils/teleconsultations";

export default function TeleconsultasPage() {
  const teleconsultations = useTelemedicineStore(
    (state) => state.teleconsultations,
  );

  const [filters, setFilters] = useState<TeleconsultationFilters>({
    search: "",
    status: "TODOS",
    priority: "TODOS",
    referral: "TODOS",
  });

  const filteredData = useMemo(() => {
    const filtered = filterTeleconsultations(teleconsultations, filters);
    return sortTeleconsultationsByDate(filtered);
  }, [teleconsultations, filters]);

  const overview = useMemo(
    () => getTeleconsultationOverview(filteredData),
    [filteredData],
  );

  return (
    <div>
      <AppHeader
        title="Teleconsultas"
        subtitle="Gestão completa de teleconsultas com pesquisa e filtros."
      />

      <PageShell>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            title="Total filtrado"
            value={overview.total}
            icon={<ListFilter className="h-4 w-4 text-muted-foreground" />}
          />
          <OverviewCard
            title="Agendadas"
            value={overview.scheduled}
            icon={<CalendarCheck2 className="h-4 w-4 text-muted-foreground" />}
          />
          <OverviewCard
            title="Em curso"
            value={overview.inProgress}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          />
          <OverviewCard
            title="Casos críticos"
            value={overview.critical}
            icon={<HeartPulse className="h-4 w-4 text-muted-foreground" />}
          />
        </section>

        <section className="rounded-2xl border bg-card p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Filtros</h2>
            <p className="text-sm text-muted-foreground">
              Pesquise e refine as teleconsultas por estado, prioridade e
              encaminhamento.
            </p>
          </div>

          <TeleconsultationsFilters filters={filters} onChange={setFilters} />
        </section>

        <section>
          <TeleconsultationsTable data={filteredData} />
        </section>
      </PageShell>
    </div>
  );
}

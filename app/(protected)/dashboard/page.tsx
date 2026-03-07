"use client";

import {
  Activity,
  ArrowRightLeft,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedStatsCard } from "@/components/dashboard/animated-stats-card";
import { PriorityConsultationsTable } from "@/components/dashboard/priority-consultations-table";
import { NextConsultationCard } from "@/components/dashboard/next-consultation-card";
import { ConsultationsTodayTable } from "@/components/dashboard/consultations-today-table";
import { useTelemedicineStore } from "@/lib/store/telemedicine-store";
import {
  getDashboardMetrics,
  getNextConsultation,
  getPriorityConsultations,
  getTodayConsultations,
} from "@/lib/utils/dashboard";

export default function DashboardPage() {
  const teleconsultations = useTelemedicineStore(
    (state) => state.teleconsultations,
  );

  const metrics = getDashboardMetrics(teleconsultations);
  const priorityCases = getPriorityConsultations(teleconsultations);
  const todayConsultations = getTodayConsultations(teleconsultations);
  const nextConsultation = getNextConsultation(teleconsultations);

  return (
    <div>
      <AppHeader
        title="Dashboard"
        subtitle="Visão geral das teleconsultas, prioridades e consultas do dia."
      />

      <PageShell>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnimatedStatsCard
            title="Teleconsultas agendadas"
            value={metrics.totalScheduled}
            icon={<CalendarCheck2 className="h-4 w-4 text-muted-foreground" />}
            delay={0}
          />
          <AnimatedStatsCard
            title="Teleconsultas em curso"
            value={metrics.inProgress}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            delay={0.05}
          />
          <AnimatedStatsCard
            title="Teleconsultas concluídas"
            value={metrics.completed}
            icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            delay={0.1}
          />
          <AnimatedStatsCard
            title="Encaminhamentos presencial"
            value={metrics.referred}
            icon={<ArrowRightLeft className="h-4 w-4 text-muted-foreground" />}
            delay={0.15}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PriorityConsultationsTable data={priorityCases} />
          </div>

          <div>
            <NextConsultationCard consultation={nextConsultation} />
          </div>
        </section>

        <section>
          <ConsultationsTodayTable data={todayConsultations} />
        </section>
      </PageShell>
    </div>
  );
}

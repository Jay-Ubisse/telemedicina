"use client";

import { useMemo } from "react";
import { FileCheck2, Hospital, History } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { OverviewCard } from "@/components/telemedicine/overview-card";
import { useTelemedicineStore } from "@/lib/store/telemedicine-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { formatDateTime } from "@/lib/utils/date";

export default function HistoricoClinicoPage() {
  const teleconsultations = useTelemedicineStore(
    (state) => state.teleconsultations,
  );

  const historyItems = useMemo(
    () =>
      teleconsultations.filter(
        (item) => item.status === "CONCLUIDA" || item.status === "ENCAMINHADA",
      ),
    [teleconsultations],
  );

  const completed = historyItems.filter(
    (item) => item.status === "CONCLUIDA",
  ).length;

  const referred = historyItems.filter(
    (item) => item.status === "ENCAMINHADA",
  ).length;

  return (
    <div>
      <AppHeader
        title="Histórico Clínico"
        subtitle="Consultas concluídas e casos encaminhados para presencial."
      />

      <PageShell>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <OverviewCard
            title="Total no histórico"
            value={historyItems.length}
            icon={<History className="h-4 w-4 text-muted-foreground" />}
          />
          <OverviewCard
            title="Concluídas"
            value={completed}
            icon={<FileCheck2 className="h-4 w-4 text-muted-foreground" />}
          />
          <OverviewCard
            title="Encaminhadas"
            value={referred}
            icon={<Hospital className="h-4 w-4 text-muted-foreground" />}
          />
        </section>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Registos clínicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <p className="text-sm font-medium">
                  Ainda não há histórico clínico
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  As consultas concluídas e encaminhadas aparecerão aqui.
                </p>
              </div>
            ) : (
              historyItems.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{item.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.province}, {item.district}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(item.scheduledAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Sintomas</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.symptoms.join(", ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Notas clínicas</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.notes || "Sem notas clínicas."}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PageShell>
    </div>
  );
}

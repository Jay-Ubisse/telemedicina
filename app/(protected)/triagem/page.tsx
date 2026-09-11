"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Inbox, Timer } from "lucide-react";

import { RequestQueue } from "@/components/dashboard/request-queue";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { EmergencyNotice } from "@/components/layout/emergency-notice";
import { PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ConsultationFiltersBar } from "@/components/telemedicine/consultation-filters";
import { ConsultationsTable } from "@/components/telemedicine/consultations-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { accessLevelFor, maskConsultation } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { timeAgo } from "@/lib/utils/date";
import {
  defaultFilters,
  filterConsultations,
  getTriageQueue,
  sortByArrival,
  type ConsultationFilters,
} from "@/lib/utils/consultations";

/**
 * Fila de triagem — o ambiente de trabalho do profissional de triagem (§1 e §2
 * do relatório).
 *
 * Os pedidos chegam sem prioridade atribuída: é aqui que um profissional de
 * saúde analisa os sintomas e as informações submetidas e classifica o pedido. A
 * plataforma não o faz por si.
 */
export default function TriagemPage() {
  const user = useSession();
  const consultations = useClinicStore((state) => state.consultations);
  const [filters, setFilters] = useState<ConsultationFilters>(defaultFilters);

  const scoped = useMemo(
    () =>
      consultations.map((item) =>
        maskConsultation(item, accessLevelFor(user, item)),
      ),
    [consultations, user],
  );

  const queue = useMemo(() => getTriageQueue(scoped), [scoped]);
  const triagedByMe = useMemo(
    () => scoped.filter((item) => item.triageProfessionalId === user.id),
    [scoped, user.id],
  );

  const filtered = useMemo(
    () => sortByArrival(filterConsultations(queue, filters)),
    [queue, filters],
  );

  /** O pedido mais antigo à espera — a espera que interessa vigiar. */
  const oldest = queue[0];

  return (
    <>
      <AppHeader
        user={user}
        title="Fila de triagem"
        subtitle="Pedidos submetidos à espera de análise e classificação."
      />

      <PageShell>
        <Alert variant="info">
          <ClipboardCheck />
          <AlertTitle>Triagem por profissional de saúde</AlertTitle>
          <AlertDescription>
            A plataforma não realiza triagem clínica nem atribui prioridades
            automaticamente. Analise os sintomas e as informações submetidas,
            atribua a prioridade, registe as observações e decida entre autorizar a
            continuidade para teleconsulta ou encaminhar para atendimento
            presencial.
          </AlertDescription>
        </Alert>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Por triar"
            value={queue.length}
            icon={Inbox}
            tone="warning"
          />
          <StatCard
            label="Triados por mim"
            value={triagedByMe.length}
            icon={ClipboardCheck}
            tone="primary"
          />
          <StatCard
            label="Pedido há mais tempo em espera"
            value={oldest ? timeAgo(oldest.createdAt) : "—"}
            icon={Timer}
            hint={oldest ? `${oldest.reference} · ${oldest.source}` : undefined}
          />
          <StatCard
            label="Críticos que triei"
            value={triagedByMe.filter((item) => item.priority === "CRITICA").length}
            icon={AlertTriangle}
            tone="danger"
          />
        </section>

        <RequestQueue
          title="Por ordem de chegada"
          description="Na triagem manda a ordem de chegada — não existe classificação prévia."
          data={queue}
          viewer={user}
          href="/triagem"
          limit={5}
          emptyTitle="Fila de triagem vazia"
          emptyDescription="Todos os pedidos submetidos já foram analisados."
        />

        <ConsultationFiltersBar filters={filters} onChange={setFilters} />

        <ConsultationsTable
          data={filtered}
          viewer={user}
          emptyDescription="Não há pedidos à espera de triagem com estes filtros."
        />

        <EmergencyNotice />
      </PageShell>
    </>
  );
}

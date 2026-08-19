"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileHeart, Hospital, History, Lock, Search } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accessLevelFor, maskConsultation } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { sortByCreatedDesc } from "@/lib/utils/consultations";
import { describeAgeYears, formatDateTime } from "@/lib/utils/date";

export default function HistoricoClinicoPage() {
  const user = useSession();
  const consultations = useClinicStore((state) => state.consultations);
  const [search, setSearch] = useState("");

  const isGuardian = user.role === "ENCARREGADO";

  const history = useMemo(() => {
    const owned = isGuardian
      ? consultations.filter(
          (item) => item.guardianId === user.id || item.phone === user.phone,
        )
      : consultations;

    // O histórico segue as mesmas regras de visibilidade do resto da
    // plataforma: notas clínicas só para quem acompanhou o caso.
    const scoped = owned.map((item) =>
      maskConsultation(item, accessLevelFor(user, item)),
    );

    const closed = scoped.filter(
      (item) => item.status === "CONCLUIDA" || item.status === "ENCAMINHADA",
    );

    const term = search.trim().toLowerCase();
    const filtered =
      term === ""
        ? closed
        : closed.filter(
            (item) =>
              item.childName.toLowerCase().includes(term) ||
              item.reference.toLowerCase().includes(term) ||
              item.symptoms.some((symptom) =>
                symptom.toLowerCase().includes(term),
              ),
          );

    return sortByCreatedDesc(filtered);
  }, [consultations, isGuardian, user, search]);

  const completed = history.filter((item) => item.status === "CONCLUIDA").length;
  const referred = history.filter((item) => item.status === "ENCAMINHADA").length;

  return (
    <>
      <AppHeader
        user={user}
        title="Histórico clínico"
        subtitle={
          isGuardian
            ? "Consultas encerradas e orientações recebidas."
            : "Registo das teleconsultas concluídas e dos casos encaminhados."
        }
      />

      <PageShell>
        {!isGuardian ? (
          <Alert variant="info">
            <Lock />
            <AlertTitle>Acesso ao conteúdo clínico</AlertTitle>
            <AlertDescription>
              {user.role === "ADMIN"
                ? "O perfil de administração vê a actividade do serviço; as notas clínicas e a orientação pertencem ao processo do profissional que acompanhou o caso."
                : "As notas clínicas e a orientação são apresentadas nas teleconsultas que acompanhou. Nos casos de colegas vê apenas o resumo, salvo acesso justificado no próprio pedido."}
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total no histórico"
            value={history.length}
            icon={History}
            tone="primary"
          />
          <StatCard
            label="Concluídas"
            value={completed}
            icon={FileHeart}
            tone="success"
          />
          <StatCard
            label="Encaminhadas"
            value={referred}
            icon={Hospital}
            tone="danger"
          />
        </section>

        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por criança, referência ou sintoma"
            aria-label="Pesquisar no histórico"
            className="h-11 rounded-xl pl-9"
          />
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <EmptyState
              icon={<FileHeart className="size-5" />}
              title="Ainda não há registos"
              description="As teleconsultas concluídas e os casos encaminhados aparecem aqui."
            />
          </div>
        ) : (
          <ol className="space-y-4">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold tracking-tight">
                      {item.childName}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {describeAgeYears(item.childAgeYears)}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.reference} ·{" "}
                      {formatDateTime(item.closedAt ?? item.createdAt)}
                      {item.assignedDoctorName
                        ? ` · ${item.assignedDoctorName}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                    <ChannelBadge channel={item.channel} />
                  </div>
                </div>

                <dl className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-3">
                  <div>
                    <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Sintomas
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed">
                      {[...item.symptoms, item.otherSymptom]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      {item.status === "ENCAMINHADA"
                        ? "Motivo do encaminhamento"
                        : "Notas clínicas"}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {(item.status === "ENCAMINHADA"
                        ? item.referralReason
                        : item.clinicalNotes) ||
                        (isGuardian ? "Sem registo." : "Reservado ao processo clínico.")}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Orientação
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.guidance ||
                        (isGuardian
                          ? "Sem orientação registada."
                          : "Reservado ao processo clínico.")}
                    </dd>
                  </div>
                </dl>

                <Button asChild variant="outline" size="sm" className="mt-5">
                  <Link href={`/teleconsultas/${item.id}`}>Ver pedido completo</Link>
                </Button>
              </li>
            ))}
          </ol>
        )}
      </PageShell>
    </>
  );
}

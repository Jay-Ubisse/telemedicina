import { Check } from "lucide-react";

import type { Consultation, ConsultationStatus } from "@/lib/types/consultation";
import { statusLabels, statusOrder } from "@/lib/types/consultation";
import { roleLabels } from "@/lib/types/user";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

/**
 * Percurso do pedido e registo das acções importantes (§3 e §4 do relatório).
 *
 * A coluna da esquerda mostra os onze estados pela ordem em que o relatório os
 * apresenta, assinalando os que o pedido já atravessou. A coluna da direita é o
 * registo de auditoria: quem fez o quê, quando — incluindo as alterações do
 * agendamento e da prioridade.
 */
export function RequestTimeline({
  consultation,
}: {
  consultation: Consultation;
}) {
  const reached = new Set<ConsultationStatus>(
    consultation.timeline.map((entry) => entry.status),
  );
  reached.add(consultation.status);

  const entries = [...consultation.timeline].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Estados do pedido</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Percurso completo, pela ordem definida para o serviço.
        </p>

        <ol className="mt-4 space-y-0">
          {statusOrder.map((status, index) => {
            const done = reached.has(status);
            const current = consultation.status === status;

            return (
              <li key={status} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold",
                      current
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done && !current ? (
                      <Check className="size-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {index < statusOrder.length - 1 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "my-0.5 w-px flex-1",
                        done ? "bg-success/30" : "bg-border",
                      )}
                    />
                  ) : null}
                </span>

                <span
                  className={cn(
                    "pb-3 text-sm",
                    current
                      ? "font-bold"
                      : done
                        ? "font-medium"
                        : "text-muted-foreground",
                  )}
                >
                  {statusLabels[status]}
                  {current ? (
                    <span className="ml-1.5 text-[0.625rem] font-bold tracking-wide text-primary uppercase">
                      actual
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Registo de acções</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Acções importantes e alterações do agendamento, guardadas para
          auditoria.
        </p>

        <ol className="mt-4 space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="border-l-2 border-border pl-4">
              <p className="text-sm font-semibold">{statusLabels[entry.status]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {entry.actorName}
                {entry.actorRole !== "SISTEMA"
                  ? ` · ${roleLabels[entry.actorRole]}`
                  : " · registo automático"}{" "}
                · {formatDateTime(entry.at)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {entry.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

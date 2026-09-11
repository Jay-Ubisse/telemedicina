import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Button } from "@/components/ui/button";
import type { Consultation } from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { primaryActionFor, symptomText } from "@/lib/utils/consultations";
import { describeAgeYears, timeAgo } from "@/lib/utils/date";

/**
 * Fila de trabalho de um painel.
 *
 * O botão de cada linha é a acção que o perfil pode executar naquela fase (§3 do
 * relatório). O antigo botão «Triar», que aparecia no painel do pediatra, deixou
 * de existir: a triagem é do profissional de triagem.
 */
export function RequestQueue({
  title,
  description,
  data,
  viewer,
  emptyTitle = "Nada pendente",
  emptyDescription = "Os pedidos aparecem aqui assim que chegarem.",
  href = "/teleconsultas",
  limit = 6,
}: {
  title: string;
  description: string;
  data: Consultation[];
  viewer: User;
  emptyTitle?: string;
  emptyDescription?: string;
  href?: string;
  limit?: number;
}) {
  const rows = data.slice(0, limit);

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            Ver todos ({data.length})
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<ShieldCheck className="size-5" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((item) => {
            const action = primaryActionFor(viewer, item);

            return (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">{item.childName}</span>
                      <span className="text-sm text-muted-foreground">
                        · {describeAgeYears(item.childAgeYears)}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {symptomText(item)}
                    </p>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {item.reference} · {item.location} · {timeAgo(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <ChannelBadge channel={item.channel} />
                      <Button asChild size="sm">
                        <Link href={`/teleconsultas/${item.id}?tab=${action.tab}`}>
                          {action.label}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

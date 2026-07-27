import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Button } from "@/components/ui/button";
import type { Consultation } from "@/lib/types/consultation";
import { describeAgeYears, timeAgo } from "@/lib/utils/date";

/**
 * Casos prioritários. A idade da criança é mostrada junto ao nome — pedido
 * explícito nas observações do protótipo.
 */
export function PriorityQueue({ data }: { data: Consultation[] }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold tracking-tight">Teleconsultas prioritárias</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Casos urgentes, críticos e pedidos que precisam de avaliação.
          </p>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href="/teleconsultas">
            Ver fila
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<ShieldCheck className="size-5" />}
            title="Nenhum caso prioritário em aberto"
            description="Os pedidos urgentes e críticos aparecem aqui no topo da fila assim que chegam."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((item) => (
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
                    {[...item.symptoms, item.otherSymptom]
                      .filter(Boolean)
                      .join(", ")}
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
                      <Link href={`/teleconsultas/${item.id}`}>Triar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

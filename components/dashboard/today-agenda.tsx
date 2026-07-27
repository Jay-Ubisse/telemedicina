"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Inbox } from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Consultation } from "@/lib/types/consultation";
import { getTodayAgenda } from "@/lib/utils/consultations";
import { describeAgeYears, formatLongDate, formatTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

/**
 * Agenda do dia.
 *
 * Antes o painel listava qualquer registo: abrir às 08:00 mostrava uma consulta
 * "de hoje" das 22:00, o que era contraditório. Agora entram apenas consultas
 * agendadas para hoje, separadas entre as que ainda estão por realizar e as que
 * já passaram — e o canal (voz / vídeo) é explícito.
 */
export function TodayAgenda({ data }: { data: Consultation[] }) {
  const agenda = getTodayAgenda(data);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const rows = tab === "upcoming" ? agenda.upcoming : agenda.past;

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-bold tracking-tight">Consultas de hoje</h2>
          <p className="mt-0.5 text-sm text-muted-foreground first-letter:uppercase">
            {formatLongDate()}
          </p>
        </div>

        <div className="flex rounded-xl bg-muted p-1">
          {(
            [
              { key: "upcoming", label: "A seguir", count: agenda.upcoming.length },
              { key: "past", label: "Já realizadas", count: agenda.past.length },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTab(option.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === option.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={tab === "upcoming" ? <Inbox className="size-5" /> : <CalendarClock className="size-5" />}
            title={
              tab === "upcoming"
                ? "Aguardando pedidos"
                : "Ainda não há consultas realizadas hoje"
            }
            description={
              tab === "upcoming"
                ? "Nenhuma teleconsulta marcada para o resto do dia. Os novos pedidos aparecem aqui assim que forem agendados."
                : "As consultas concluídas ou encerradas hoje passam a constar neste separador."
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Hora</TableHead>
                <TableHead>Criança</TableHead>
                <TableHead className="w-24">Idade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24 text-right">Acção</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm font-semibold tabular-nums">
                    {formatTime(item.scheduledAt!)}
                  </TableCell>
                  <TableCell className="font-medium">{item.childName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {describeAgeYears(item.childAgeYears)}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                    {item.location}
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={item.channel} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teleconsultas/${item.id}`}>Abrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

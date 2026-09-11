"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocation } from "@/lib/data/locations";
import type { Consultation } from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { primaryActionFor, symptomText } from "@/lib/utils/consultations";
import { describeAgeYears, formatDateTime, timeAgo } from "@/lib/utils/date";

/**
 * Lista de pedidos.
 *
 * As colunas são as que o relatório enumera em §7 — referência, idade, sintomas,
 * prioridade, data/hora, profissional de triagem, pediatra atribuído, estado e
 * canal — e o botão de cada linha é a acção que o perfil pode mesmo executar
 * naquela fase (§3), e não um «Abrir» genérico.
 */
export function ConsultationsTable({
  data,
  viewer,
  emptyDescription,
}: {
  data: Consultation[];
  viewer: User;
  emptyDescription?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Nenhum pedido encontrado"
          description={
            emptyDescription ??
            "Ajuste os filtros ou aguarde novos pedidos vindos do canal USSD e da plataforma web."
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div className="overflow-x-auto">
        <Table className="min-w-[1240px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Pedido</TableHead>
              <TableHead>Criança</TableHead>
              <TableHead className="w-24">Idade</TableHead>
              <TableHead>Sintomas</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Triagem</TableHead>
              <TableHead>Pediatra</TableHead>
              <TableHead>Data / hora</TableHead>
              <TableHead className="w-40 text-right">Acção</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((item) => {
              const action = primaryActionFor(viewer, item);

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="text-xs font-semibold">{item.reference}</span>
                    <Badge
                      variant="ghost"
                      className="ml-1.5 h-4 px-1.5 text-[0.5625rem] font-bold tracking-wider text-muted-foreground uppercase ring-1 ring-border"
                    >
                      {item.source}
                    </Badge>
                    <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
                      {timeAgo(item.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-medium">{item.childName}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.guardianName}
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {describeAgeYears(item.childAgeYears)}
                  </TableCell>

                  <TableCell className="max-w-[14rem]">
                    <span className="line-clamp-2 text-muted-foreground">
                      {symptomText(item)}
                    </span>
                  </TableCell>

                  <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                    {formatLocation(item.location)}
                  </TableCell>

                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>

                  <TableCell>
                    <ChannelBadge channel={item.channel} />
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {item.triageProfessionalName ?? "Por triar"}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {item.assignedDoctorName ?? "Por atribuir"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {item.scheduledAt ? formatDateTime(item.scheduledAt) : "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teleconsultas/${item.id}?tab=${action.tab}`}>
                        {action.label}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  channelLabels,
  channelOptions,
  priorityLabels,
  statusLabels,
  statusOrder,
} from "@/lib/types/consultation";
import {
  defaultFilters,
  type ConsultationFilters,
} from "@/lib/utils/consultations";

type Props = {
  filters: ConsultationFilters;
  onChange: (filters: ConsultationFilters) => void;
};

const priorities = ["CRITICA", "URGENTE", "NORMAL", "SEM_TRIAGEM"] as const;

/**
 * Barra de filtros. Os estados são apresentados exactamente na ordem da lista do
 * §3 do relatório.
 */
export function ConsultationFiltersBar({ filters, onChange }: Props) {
  const dirty =
    filters.search !== "" ||
    filters.status !== "TODOS" ||
    filters.priority !== "TODOS" ||
    filters.channel !== "TODOS" ||
    filters.source !== "TODOS";

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
            placeholder="Criança, encarregado, referência ou sintoma"
            aria-label="Pesquisar"
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ ...filters, status: value as ConsultationFilters["status"] })
          }
        >
          <SelectTrigger className="h-10 rounded-xl" aria-label="Estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os estados</SelectItem>
            {statusOrder.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) =>
            onChange({
              ...filters,
              priority: value as ConsultationFilters["priority"],
            })
          }
        >
          <SelectTrigger className="h-10 rounded-xl" aria-label="Prioridade">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as prioridades</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priorityLabels[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.channel}
          onValueChange={(value) =>
            onChange({
              ...filters,
              channel: value as ConsultationFilters["channel"],
            })
          }
        >
          <SelectTrigger className="h-10 rounded-xl" aria-label="Modalidade">
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as modalidades</SelectItem>
            {channelOptions.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channelLabels[channel]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.source}
          onValueChange={(value) =>
            onChange({
              ...filters,
              source: value as ConsultationFilters["source"],
            })
          }
        >
          <SelectTrigger className="h-10 rounded-xl" aria-label="Origem">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as origens</SelectItem>
            <SelectItem value="USSD">USSD</SelectItem>
            <SelectItem value="WEB">Web</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dirty ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => onChange(defaultFilters)}
        >
          <X data-icon="inline-start" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}

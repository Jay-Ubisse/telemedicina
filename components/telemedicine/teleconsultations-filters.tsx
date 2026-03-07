"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConsultationPriority,
  ConsultationStatus,
} from "@/lib/types/teleconsultation";
import type { TeleconsultationFilters } from "@/lib/utils/teleconsultations";

type Props = {
  filters: TeleconsultationFilters;
  onChange: (filters: TeleconsultationFilters) => void;
};

export function TeleconsultationsFilters({ filters, onChange }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="relative lg:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) =>
            onChange({
              ...filters,
              search: e.target.value,
            })
          }
          placeholder="Pesquisar paciente ou telefone"
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onChange({
            ...filters,
            status: value as ConsultationStatus | "TODOS",
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os estados</SelectItem>
          <SelectItem value="AGENDADA">Agendada</SelectItem>
          <SelectItem value="EM_CURSO">Em curso</SelectItem>
          <SelectItem value="CONCLUIDA">Concluída</SelectItem>
          <SelectItem value="ENCAMINHADA">Encaminhada</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) =>
          onChange({
            ...filters,
            priority: value as ConsultationPriority | "TODOS",
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todas as prioridades</SelectItem>
          <SelectItem value="NORMAL">Normal</SelectItem>
          <SelectItem value="URGENTE">Urgente</SelectItem>
          <SelectItem value="CRITICO">Crítico</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.referral}
        onValueChange={(value) =>
          onChange({
            ...filters,
            referral: value as TeleconsultationFilters["referral"],
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por encaminhamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos</SelectItem>
          <SelectItem value="ENCAMINHADOS">Encaminhados</SelectItem>
          <SelectItem value="NAO_ENCAMINHADOS">Não encaminhados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

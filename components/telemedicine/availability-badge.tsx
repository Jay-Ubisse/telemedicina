import { Badge } from "@/components/ui/badge";
import type { DoctorAvailabilityStatus } from "@/lib/types/availability";
import { shortDoctorAvailabilityLabels } from "@/lib/types/availability";
import { cn } from "@/lib/utils";

/**
 * Situação de um pediatra num dado momento (§14 do relatório).
 *
 * «Disponível» é reservado a quem está de facto dentro do turno registado — ou
 * tem disponibilidade adicional. Fora disso, o crachá diz o que se passa: fora do
 * turno, indisponível, ausente ou sem acesso à plataforma.
 */
const styles: Record<DoctorAvailabilityStatus, string> = {
  DISPONIVEL_TURNO: "bg-success/12 text-success ring-1 ring-success/25",
  DISPONIVEL_ADICIONAL: "bg-accent-soft text-accent-foreground ring-1 ring-accent/40",
  FORA_DE_TURNO: "bg-muted text-muted-foreground ring-1 ring-border",
  INDISPONIVEL: "bg-warning/18 text-warning-foreground ring-1 ring-warning/40",
  AUSENTE: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  CONTA_INACTIVA: "bg-muted text-muted-foreground ring-1 ring-border line-through",
};

export function AvailabilityBadge({
  status,
  className,
}: {
  status: DoctorAvailabilityStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-6 px-2 text-[0.6875rem] font-semibold tracking-wide uppercase",
        styles[status],
        className,
      )}
    >
      {shortDoctorAvailabilityLabels[status]}
    </Badge>
  );
}

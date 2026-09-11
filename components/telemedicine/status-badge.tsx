import { Badge } from "@/components/ui/badge";
import type { ConsultationStatus } from "@/lib/types/consultation";
import { shortStatusLabels, statusLabels } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

/**
 * Crachá de estado para os onze estados do pedido (§3 do relatório).
 *
 * A cor acompanha a fase: cinzento enquanto o pedido espera por alguém, azul
 * quando está em mãos de um profissional, verde quando a consulta acontece ou
 * termina, vermelho no encaminhamento e neutro barrado no cancelamento. O texto
 * nunca depende da cor.
 */
const styles: Record<ConsultationStatus, string> = {
  SUBMETIDO: "bg-muted text-muted-foreground ring-1 ring-border",
  AGUARDA_TRIAGEM: "bg-warning/18 text-warning-foreground ring-1 ring-warning/40",
  TRIAGEM_CONCLUIDA:
    "bg-primary-soft text-secondary-foreground ring-1 ring-primary/25",
  AGUARDA_ATRIBUICAO: "bg-muted text-muted-foreground ring-1 ring-border",
  PEDIATRA_ATRIBUIDO:
    "bg-primary-soft text-secondary-foreground ring-1 ring-primary/25",
  AGUARDA_AGENDAMENTO: "bg-muted text-muted-foreground ring-1 ring-border",
  CONSULTA_AGENDADA:
    "bg-primary-soft text-secondary-foreground ring-1 ring-primary/25",
  CONSULTA_EM_CURSO: "bg-accent-soft text-accent-foreground ring-1 ring-accent/40",
  CONSULTA_CONCLUIDA: "bg-success/12 text-success ring-1 ring-success/25",
  ENCAMINHADO_PRESENCIAL:
    "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  CANCELADO: "bg-muted text-muted-foreground ring-1 ring-border line-through",
};

export function StatusBadge({
  status,
  className,
  full = false,
}: {
  status: ConsultationStatus;
  className?: string;
  /** Texto completo do estado, para ecrãs com espaço. */
  full?: boolean;
}) {
  return (
    <Badge
      variant="ghost"
      title={statusLabels[status]}
      className={cn(
        "h-6 gap-1.5 px-2 text-[0.6875rem] font-semibold tracking-wide uppercase",
        styles[status],
        className,
      )}
    >
      {status === "CONSULTA_EM_CURSO" ? (
        <span
          className="size-1.5 animate-pulse rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {full ? statusLabels[status] : shortStatusLabels[status]}
    </Badge>
  );
}

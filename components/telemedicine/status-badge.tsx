import { Badge } from "@/components/ui/badge";
import type { ConsultationStatus } from "@/lib/types/consultation";
import { statusLabels } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

const styles: Record<ConsultationStatus, string> = {
  PENDENTE: "bg-muted text-muted-foreground ring-1 ring-border",
  AGENDADA: "bg-primary-soft text-secondary-foreground ring-1 ring-primary/25",
  EM_CURSO: "bg-accent-soft text-accent-foreground ring-1 ring-accent/40",
  CONCLUIDA: "bg-success/12 text-success ring-1 ring-success/25",
  ENCAMINHADA: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ConsultationStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-6 gap-1.5 px-2 text-[0.6875rem] font-semibold tracking-wide uppercase",
        styles[status],
        className,
      )}
    >
      {status === "EM_CURSO" ? (
        <span
          className="size-1.5 animate-pulse rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {statusLabels[status]}
    </Badge>
  );
}

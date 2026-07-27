import { AlertTriangle, CircleDot, Clock, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConsultationPriority } from "@/lib/types/consultation";
import { priorityLabels } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

const styles: Record<ConsultationPriority, string> = {
  CRITICA: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  URGENTE: "bg-warning/18 text-warning-foreground ring-1 ring-warning/40",
  AVALIACAO: "bg-primary-soft text-secondary-foreground ring-1 ring-primary/20",
  NORMAL: "bg-success/12 text-success ring-1 ring-success/25",
};

const icons: Record<ConsultationPriority, typeof AlertTriangle> = {
  CRITICA: AlertTriangle,
  URGENTE: Clock,
  AVALIACAO: HelpCircle,
  NORMAL: CircleDot,
};

export function PriorityBadge({
  priority,
  className,
  showIcon = true,
}: {
  priority: ConsultationPriority;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = icons[priority];

  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-6 gap-1 px-2 text-[0.6875rem] font-semibold tracking-wide uppercase",
        styles[priority],
        className,
      )}
    >
      {showIcon ? <Icon aria-hidden /> : null}
      {priorityLabels[priority]}
    </Badge>
  );
}

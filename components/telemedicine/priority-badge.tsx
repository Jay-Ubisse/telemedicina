import { Badge } from "@/components/ui/badge";
import type { ConsultationPriority } from "@/lib/types/teleconsultation";

export function PriorityBadge({
  priority,
}: {
  priority: ConsultationPriority;
}) {
  if (priority === "CRITICO") {
    return <Badge variant="destructive">Crítico</Badge>;
  }

  if (priority === "URGENTE") {
    return <Badge variant="secondary">Urgente</Badge>;
  }

  return <Badge variant="outline">Normal</Badge>;
}

import { Badge } from "@/components/ui/badge";
import type { ConsultationStatus } from "@/lib/types/teleconsultation";

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  if (status === "EM_CURSO") {
    return <Badge>Em curso</Badge>;
  }

  if (status === "CONCLUIDA") {
    return <Badge variant="secondary">Concluída</Badge>;
  }

  if (status === "ENCAMINHADA") {
    return <Badge variant="destructive">Encaminhada</Badge>;
  }

  return <Badge variant="outline">Agendada</Badge>;
}

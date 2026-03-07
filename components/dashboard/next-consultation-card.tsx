import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Teleconsultation } from "@/lib/types/teleconsultation";
import { PriorityBadge } from "../telemedicine/priority-badge";
import { formatDateTime } from "@/lib/utils/date";

export function NextConsultationCard({
  consultation,
}: {
  consultation?: Teleconsultation;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Próxima teleconsulta</CardTitle>
      </CardHeader>

      <CardContent>
        {!consultation ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma teleconsulta próxima.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold">
                {consultation.patientName}
              </p>
              <p className="text-sm text-muted-foreground">
                {consultation.phone}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Data e hora:</span>{" "}
                {formatDateTime(consultation.scheduledAt)}
              </p>
              <p>
                <span className="font-medium">Localização:</span>{" "}
                {consultation.province}, {consultation.district}
              </p>
              <p>
                <span className="font-medium">Sintomas:</span>{" "}
                {consultation.symptoms.join(", ")}
              </p>
            </div>

            <PriorityBadge priority={consultation.priority} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

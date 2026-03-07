import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Teleconsultation } from "@/lib/types/teleconsultation";
import { PriorityBadge } from "../telemedicine/priority-badge";
import { formatTime } from "@/lib/utils/date";

export function PriorityConsultationsTable({
  data,
}: {
  data: Teleconsultation[];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Teleconsultas prioritárias</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum caso prioritário encontrado.
          </p>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="font-semibold">{item.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.province} • {item.district}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.symptoms.join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <PriorityBadge priority={item.priority} />
                <span className="text-sm text-muted-foreground">
                  {formatTime(item.scheduledAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

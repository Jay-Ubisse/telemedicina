import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Teleconsultation } from "@/lib/types/teleconsultation";
import { formatTime } from "@/lib/utils/date";
import { PriorityBadge } from "../telemedicine/priority-badge";

export function ConsultationsTodayTable({
  data,
}: {
  data: Teleconsultation[];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Consultas de hoje</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridade</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatTime(item.scheduledAt)}</TableCell>
                  <TableCell className="font-medium">
                    {item.patientName}
                  </TableCell>
                  <TableCell>
                    {item.province}, {item.district}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

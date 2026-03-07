import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Teleconsultation } from "@/lib/types/teleconsultation";
import { formatDateTime } from "@/lib/utils/date";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { Badge } from "@/components/ui/badge";

type Props = {
  data: Teleconsultation[];
};

export function TeleconsultationsTable({ data }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Todas as teleconsultas</CardTitle>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-sm font-medium">
              Nenhuma teleconsulta encontrada
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou aguarde novas submissões do simulador USSD.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Sintomas</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Encaminhamento</TableHead>
                  <TableHead>Agendada para</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.patientName}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>
                      {item.province}, {item.district}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="line-clamp-2">
                        {item.symptoms.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={item.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      {item.referredToPresential ? (
                        <Badge variant="destructive">Presencial</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(item.scheduledAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

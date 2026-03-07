import type { UssdFormData } from "@/lib/types/ussd";
import { buildSymptomsList, getPriorityFromSymptoms } from "@/lib/utils/ussd";

export function UssdSummary({ data }: { data: UssdFormData }) {
  const symptoms = buildSymptomsList(data);
  const priority = getPriorityFromSymptoms(symptoms);

  return (
    <div className="space-y-3 rounded-2xl border p-4 text-sm">
      <div>
        <p className="font-medium">Paciente</p>
        <p className="text-muted-foreground">
          {data.patientName} • {data.phone}
        </p>
      </div>

      <div>
        <p className="font-medium">Dados pessoais</p>
        <p className="text-muted-foreground">
          {data.age} anos • {data.sex} • {data.province}, {data.district}
        </p>
      </div>

      <div>
        <p className="font-medium">Sintomas</p>
        <p className="text-muted-foreground">
          {symptoms.length > 0
            ? symptoms.join(", ")
            : "Nenhum sintoma informado"}
        </p>
      </div>

      <div>
        <p className="font-medium">Notas</p>
        <p className="text-muted-foreground">
          {data.notes || "Sem observações adicionais"}
        </p>
      </div>

      <div>
        <p className="font-medium">Prioridade estimada</p>
        <p className="text-muted-foreground">{priority}</p>
      </div>
    </div>
  );
}

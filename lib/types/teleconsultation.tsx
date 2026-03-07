export type ConsultationPriority = "NORMAL" | "URGENTE" | "CRITICO";

export type ConsultationStatus =
  | "AGENDADA"
  | "EM_CURSO"
  | "CONCLUIDA"
  | "ENCAMINHADA";

export type Teleconsultation = {
  id: string;
  patientName: string;
  phone: string;
  age: number;
  sex: "M" | "F";
  province: string;
  district: string;
  symptoms: string[];
  notes?: string;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  scheduledAt: string;
  createdAt: string;
  referredToPresential: boolean;
};

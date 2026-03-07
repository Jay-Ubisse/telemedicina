import type {
  ConsultationPriority,
  Teleconsultation,
} from "../types/teleconsultation";
import type { UssdFormData } from "../types/ussd";

export function getPriorityFromSymptoms(
  symptoms: string[],
): ConsultationPriority {
  const normalized = symptoms.map((item) => item.toLowerCase());

  const criticalSymptoms = [
    "dificuldade respiratória",
    "dor no peito",
    "perda de consciência",
  ];

  const urgentSymptoms = [
    "febre",
    "tontura",
    "fraqueza",
    "dor abdominal forte",
  ];

  if (normalized.some((item) => criticalSymptoms.includes(item))) {
    return "CRITICO";
  }

  if (normalized.some((item) => urgentSymptoms.includes(item))) {
    return "URGENTE";
  }

  return "NORMAL";
}

export function buildSymptomsList(data: UssdFormData) {
  const extra = data.otherSymptoms.trim();
  return extra ? [...data.symptoms, extra] : data.symptoms;
}

export function generateScheduledAt(priority: ConsultationPriority) {
  const now = new Date();

  if (priority === "CRITICO") {
    now.setMinutes(now.getMinutes() + 10);
    return now.toISOString();
  }

  if (priority === "URGENTE") {
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString();
  }

  now.setHours(now.getHours() + 2);
  return now.toISOString();
}

export function buildTeleconsultationFromUssd(
  data: UssdFormData,
): Omit<Teleconsultation, "id" | "createdAt"> {
  const symptoms = buildSymptomsList(data);
  const priority = getPriorityFromSymptoms(symptoms);

  return {
    patientName: data.patientName.trim(),
    phone: data.phone.trim(),
    age: Number(data.age),
    sex: data.sex || "M",
    province: data.province.trim(),
    district: data.district.trim(),
    symptoms,
    notes: data.notes.trim(),
    priority,
    status: "AGENDADA",
    scheduledAt: generateScheduledAt(priority),
    referredToPresential: priority === "CRITICO",
  };
}

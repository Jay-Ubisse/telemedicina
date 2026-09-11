import type { ConsultationChannel } from "./consultation";

/**
 * Disponibilidade declarada por um pediatra (§8 do relatório).
 *
 * Cada registo indica dia, hora inicial e final, duração prevista, modalidade
 * (texto, áudio ou vídeo), estado e observações. O `kind` distingue o que o
 * relatório pede em §14: o turno registado, a disponibilidade adicional fora
 * desse turno e as ausências.
 */
export type AvailabilityKind = "TURNO" | "ADICIONAL" | "AUSENCIA";

export const availabilityKindLabels: Record<AvailabilityKind, string> = {
  TURNO: "Turno registado",
  ADICIONAL: "Disponibilidade adicional",
  AUSENCIA: "Ausência ou indisponibilidade",
};

/** Estado do próprio registo de disponibilidade. */
export type AvailabilityState = "ACTIVA" | "CANCELADA";

export const availabilityStateLabels: Record<AvailabilityState, string> = {
  ACTIVA: "Em vigor",
  CANCELADA: "Cancelada",
};

export type Availability = {
  id: string;
  doctorId: string;
  doctorName: string;
  /** Dia (ISO, YYYY-MM-DD). */
  date: string;
  /** Hora inicial (HH:mm). */
  startTime: string;
  /** Hora final (HH:mm). */
  endTime: string;
  /** Duração prevista de cada atendimento, em minutos. */
  durationMinutes: number;
  /** Modalidade: texto, áudio ou vídeo. */
  modality: ConsultationChannel;
  state: AvailabilityState;
  kind: AvailabilityKind;
  notes: string;
  createdAt: string;
};

/**
 * Como o serviço vê um pediatra num dado momento. São exactamente as cinco
 * distinções pedidas em §14, mais o caso da conta sem acesso.
 */
export type DoctorAvailabilityStatus =
  | "CONTA_INACTIVA"
  | "AUSENTE"
  | "INDISPONIVEL"
  | "FORA_DE_TURNO"
  | "DISPONIVEL_ADICIONAL"
  | "DISPONIVEL_TURNO";

export const doctorAvailabilityLabels: Record<DoctorAvailabilityStatus, string> = {
  CONTA_INACTIVA: "Conta sem acesso",
  AUSENTE: "Ausente",
  INDISPONIVEL: "Indisponível no turno",
  FORA_DE_TURNO: "Fora do turno",
  DISPONIVEL_ADICIONAL: "Disponível (disponibilidade adicional)",
  DISPONIVEL_TURNO: "Disponível no turno",
};

export const shortDoctorAvailabilityLabels: Record<
  DoctorAvailabilityStatus,
  string
> = {
  CONTA_INACTIVA: "Sem acesso",
  AUSENTE: "Ausente",
  INDISPONIVEL: "Indisponível",
  FORA_DE_TURNO: "Fora do turno",
  DISPONIVEL_ADICIONAL: "Disponível (adicional)",
  DISPONIVEL_TURNO: "Disponível",
};

export function isDoctorAvailable(status: DoctorAvailabilityStatus) {
  return status === "DISPONIVEL_TURNO" || status === "DISPONIVEL_ADICIONAL";
}

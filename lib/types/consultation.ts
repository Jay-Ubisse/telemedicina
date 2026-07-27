import type { UserRole } from "./user";

/**
 * Estados da consulta (ver `docs/Observações protótipo.docx`):
 * PENDENTE   – pedido recebido via USSD ou web, ainda sem horário
 * AGENDADA   – horário definido pelo pediatra
 * EM_CURSO   – teleconsulta em andamento
 * CONCLUIDA  – teleconsulta finalizada
 * ENCAMINHADA– caso direcionado para uma unidade de saúde
 */
export type ConsultationStatus =
  | "PENDENTE"
  | "AGENDADA"
  | "EM_CURSO"
  | "CONCLUIDA"
  | "ENCAMINHADA";

/**
 * NORMAL    – sintomas leves, teleconsulta regular
 * URGENTE   – sintomas urgentes, teleconsulta prioritária
 * CRITICA   – sintomas críticos, encaminhamento imediato
 * AVALIACAO – sintoma livre ("Outro"), requer avaliação de um profissional
 */
export type ConsultationPriority =
  | "NORMAL"
  | "URGENTE"
  | "CRITICA"
  | "AVALIACAO";

/** Canal de atendimento escolhido pelo encarregado. */
export type ConsultationChannel = "VOZ" | "VIDEO";

export type ConsultationSource = "USSD" | "WEB";

export type AttachmentKind = "IMAGEM" | "EXAME" | "DOCUMENTO";

export type Attachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  addedAt: string;
};

export type ChatMessage = {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  sentAt: string;
};

export type Consultation = {
  id: string;
  /** Referência legível do pedido, ex.: R-1042. */
  reference: string;
  childId: string;
  childName: string;
  childAgeYears: number;
  guardianId: string | null;
  guardianName: string;
  phone: string;
  /** Bairro / avenida (cidade de Maputo). Substitui província + distrito. */
  location: string;
  symptoms: string[];
  otherSymptom: string;
  notes: string;
  channel: ConsultationChannel;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  source: ConsultationSource;
  createdAt: string;
  scheduledAt: string | null;
  /** Link da sala, gerado apenas quando o canal é VIDEO. */
  meetingLink: string | null;
  meetingLinkExpiresAt: string | null;
  /** Momento em que o SMS com o link foi enviado ao encarregado. */
  smsSentAt: string | null;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
  clinicalNotes: string;
  /** Orientação clínica entregue ao encarregado. */
  guidance: string;
  referralReason: string;
  attachments: Attachment[];
  messages: ChatMessage[];
  closedAt: string | null;
  /** Marca os registos de demonstração, realinhados ao dia actual. */
  seeded?: boolean;
};

export const statusLabels: Record<ConsultationStatus, string> = {
  PENDENTE: "Pendente",
  AGENDADA: "Agendada",
  EM_CURSO: "Em curso",
  CONCLUIDA: "Concluída",
  ENCAMINHADA: "Encaminhada",
};

export const priorityLabels: Record<ConsultationPriority, string> = {
  NORMAL: "Normal",
  URGENTE: "Urgente",
  CRITICA: "Crítica",
  AVALIACAO: "Avaliação necessária",
};

export const channelLabels: Record<ConsultationChannel, string> = {
  VOZ: "Chamada de voz",
  VIDEO: "Videochamada",
};

/** Estados em que um pedido ainda está aberto (bloqueia duplicados). */
export const openStatuses: ConsultationStatus[] = [
  "PENDENTE",
  "AGENDADA",
  "EM_CURSO",
];

import type { UserRole } from "./user";

/**
 * Estados da consulta (ver `docs/relatorio.docx`):
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
  /** Tipo MIME do ficheiro escolhido pelo utilizador. */
  mimeType?: string;
  /** Dimensão em bytes. */
  size?: number;
  /**
   * Conteúdo do ficheiro em `data:` URL. Só existe nos anexos realmente
   * carregados nesta sessão — os anexos semeados são apenas ilustrativos.
   */
  dataUrl?: string;
};

/** Motivos que justificam o acesso de um pediatra não atribuído ao caso. */
export type AccessReason =
  | "SUBSTITUICAO"
  | "APOIO_CLINICO"
  | "ENCAMINHAMENTO_INTERNO";

export const accessReasonLabels: Record<AccessReason, string> = {
  SUBSTITUICAO: "Substituição do profissional",
  APOIO_CLINICO: "Apoio clínico ao colega",
  ENCAMINHAMENTO_INTERNO: "Encaminhamento interno",
};

/** Registo de auditoria de um acesso excepcional ao processo clínico. */
export type AccessLogEntry = {
  id: string;
  userId: string;
  userName: string;
  reason: AccessReason;
  note: string;
  at: string;
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
  /** Acessos excepcionais ao processo clínico, para efeitos de auditoria. */
  accessLog: AccessLogEntry[];
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

/** Estados encerrados — o link da videochamada deixa de ser válido. */
export const closedStatuses: ConsultationStatus[] = ["CONCLUIDA", "ENCAMINHADA"];

/** Estados em que um pedido ainda está aberto (bloqueia duplicados). */
export const openStatuses: ConsultationStatus[] = [
  "PENDENTE",
  "AGENDADA",
  "EM_CURSO",
];

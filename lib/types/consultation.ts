import type { UserRole } from "./user";

/**
 * Estados do pedido, na ordem em que o relatório os apresenta (§3).
 *
 *  1. `SUBMETIDO`              — Pedido submetido
 *  2. `AGUARDA_TRIAGEM`        — Aguardando triagem
 *  3. `TRIAGEM_CONCLUIDA`      — Triagem concluída
 *  4. `AGUARDA_ATRIBUICAO`     — Aguardando atribuição
 *  5. `PEDIATRA_ATRIBUIDO`     — Pediatra atribuído
 *  6. `AGUARDA_AGENDAMENTO`    — Aguardando agendamento
 *  7. `CONSULTA_AGENDADA`      — Consulta agendada
 *  8. `CONSULTA_EM_CURSO`      — Consulta em curso
 *  9. `CONSULTA_CONCLUIDA`     — Consulta concluída
 * 10. `ENCAMINHADO_PRESENCIAL` — Encaminhado para atendimento presencial
 * 11. `CANCELADO`              — Cancelado
 *
 * `SUBMETIDO` é o estado do instante da submissão: fica registado na linha
 * cronológica do pedido e é o que o encarregado vê no ecrã de confirmação. O
 * pedido guardado avança de imediato para `AGUARDA_TRIAGEM`, como o relatório
 * exige («depois da submissão, o pedido deve ficar com o estado: Aguardando
 * triagem»).
 */
export type ConsultationStatus =
  | "SUBMETIDO"
  | "AGUARDA_TRIAGEM"
  | "TRIAGEM_CONCLUIDA"
  | "AGUARDA_ATRIBUICAO"
  | "PEDIATRA_ATRIBUIDO"
  | "AGUARDA_AGENDAMENTO"
  | "CONSULTA_AGENDADA"
  | "CONSULTA_EM_CURSO"
  | "CONSULTA_CONCLUIDA"
  | "ENCAMINHADO_PRESENCIAL"
  | "CANCELADO";

/** A ordem é significativa: alimenta a linha cronológica e os filtros. */
export const statusOrder: ConsultationStatus[] = [
  "SUBMETIDO",
  "AGUARDA_TRIAGEM",
  "TRIAGEM_CONCLUIDA",
  "AGUARDA_ATRIBUICAO",
  "PEDIATRA_ATRIBUIDO",
  "AGUARDA_AGENDAMENTO",
  "CONSULTA_AGENDADA",
  "CONSULTA_EM_CURSO",
  "CONSULTA_CONCLUIDA",
  "ENCAMINHADO_PRESENCIAL",
  "CANCELADO",
];

export const statusLabels: Record<ConsultationStatus, string> = {
  SUBMETIDO: "Pedido submetido",
  AGUARDA_TRIAGEM: "Aguardando triagem",
  TRIAGEM_CONCLUIDA: "Triagem concluída",
  AGUARDA_ATRIBUICAO: "Aguardando atribuição",
  PEDIATRA_ATRIBUIDO: "Pediatra atribuído",
  AGUARDA_AGENDAMENTO: "Aguardando agendamento",
  CONSULTA_AGENDADA: "Consulta agendada",
  CONSULTA_EM_CURSO: "Consulta em curso",
  CONSULTA_CONCLUIDA: "Consulta concluída",
  ENCAMINHADO_PRESENCIAL: "Encaminhado para atendimento presencial",
  CANCELADO: "Cancelado",
};

/** Versão curta para crachás e colunas estreitas. */
export const shortStatusLabels: Record<ConsultationStatus, string> = {
  ...statusLabels,
  ENCAMINHADO_PRESENCIAL: "Encaminhado (presencial)",
};

/**
 * Prioridade clínica. `SEM_TRIAGEM` é o valor de um pedido recém-submetido: a
 * plataforma não classifica nada por si — a prioridade é sempre atribuída pelo
 * profissional de triagem (§2 do relatório).
 */
export type ConsultationPriority =
  | "SEM_TRIAGEM"
  | "NORMAL"
  | "URGENTE"
  | "CRITICA";

export const priorityLabels: Record<ConsultationPriority, string> = {
  SEM_TRIAGEM: "Sem triagem",
  NORMAL: "Normal",
  URGENTE: "Urgente",
  CRITICA: "Crítica",
};

/** Prioridades que o profissional de triagem pode atribuir. */
export const assignablePriorities: ConsultationPriority[] = [
  "NORMAL",
  "URGENTE",
  "CRITICA",
];

/**
 * Modalidade de atendimento: texto, áudio ou vídeo (§8 do relatório). É a mesma
 * lista usada na disponibilidade dos pediatras e no agendamento.
 */
export type ConsultationChannel = "TEXTO" | "AUDIO" | "VIDEO";

export const channelLabels: Record<ConsultationChannel, string> = {
  TEXTO: "Mensagens de texto",
  AUDIO: "Chamada de áudio",
  VIDEO: "Videochamada",
};

export const shortChannelLabels: Record<ConsultationChannel, string> = {
  TEXTO: "Texto",
  AUDIO: "Áudio",
  VIDEO: "Vídeo",
};

export const channelOptions: ConsultationChannel[] = ["VIDEO", "AUDIO", "TEXTO"];

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

/** Destino dado ao pedido pelo profissional de triagem. */
export type TriageOutcome = "TELECONSULTA" | "PRESENCIAL";

export const triageOutcomeLabels: Record<TriageOutcome, string> = {
  TELECONSULTA: "Autorizada a continuidade para teleconsulta",
  PRESENCIAL: "Encaminhado para atendimento presencial",
};

/**
 * Alteração de prioridade. O relatório exige que qualquer alteração seja
 * justificada — por isso a justificação é obrigatória e fica registada com o
 * autor e o momento.
 */
export type PriorityChange = {
  id: string;
  from: ConsultationPriority;
  to: ConsultationPriority;
  justification: string;
  byId: string;
  byName: string;
  at: string;
};

/**
 * Alteração do agendamento (§8): exige nova data, nova hora e motivo, e guarda
 * o horário anterior e o autor da alteração.
 */
export type ScheduleChange = {
  id: string;
  previousScheduledAt: string | null;
  newScheduledAt: string;
  previousDurationMinutes: number | null;
  newDurationMinutes: number;
  reason: string;
  byId: string;
  byName: string;
  at: string;
};

/**
 * Prescrição demonstrativa (§10). Só o pediatra a cria ou altera; o encarregado
 * responsável pela criança vê-a; o perfil administrativo nunca.
 */
export type Prescription = {
  id: string;
  /** Medicamento. */
  medication: string;
  /** Dosagem, ex.: "250 mg". */
  dosage: string;
  /** Frequência, ex.: "8 em 8 horas". */
  frequency: string;
  /** Duração, ex.: "5 dias". */
  duration: string;
  /** Via de administração. */
  route: PrescriptionRoute;
  /** Recomendações adicionais. */
  recommendations: string;
  /** Data da prescrição. */
  issuedAt: string;
  /** Identificação do pediatra que prescreveu. */
  doctorId: string;
  doctorName: string;
  doctorLicenseNumber: string;
  updatedAt?: string;
};

export type PrescriptionRoute =
  | "ORAL"
  | "TOPICA"
  | "INALATORIA"
  | "RECTAL"
  | "OCULAR"
  | "NASAL";

export const prescriptionRouteLabels: Record<PrescriptionRoute, string> = {
  ORAL: "Oral",
  TOPICA: "Tópica (cutânea)",
  INALATORIA: "Inalatória",
  RECTAL: "Rectal",
  OCULAR: "Ocular",
  NASAL: "Nasal",
};

/** Aviso obrigatório em qualquer prescrição do protótipo. */
export const PRESCRIPTION_DISCLAIMER =
  "Prescrição demonstrativa criada no contexto de um protótipo académico. Não utilizar para fins clínicos reais.";

/**
 * Linha cronológica do pedido: serve de registo de auditoria das acções
 * importantes e das alterações do agendamento (§4 do relatório).
 */
export type TimelineEntry = {
  id: string;
  status: ConsultationStatus;
  /** Detalhe da acção, quando há mais a dizer do que o nome do estado. */
  detail: string;
  at: string;
  actorId: string | null;
  actorName: string;
  actorRole: UserRole | "SISTEMA";
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
  /** Bairro / avenida (cidade de Maputo) ou bairro indicado manualmente. */
  location: string;
  symptoms: string[];
  otherSymptom: string;
  notes: string;
  channel: ConsultationChannel;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  source: ConsultationSource;
  createdAt: string;

  // --- consentimento -------------------------------------------------------
  /**
   * Momento em que o encarregado autorizou a teleconsulta. Sem consentimento
   * não há consulta, e a consulta nunca é gravada automaticamente (§4).
   */
  consentGivenAt: string | null;

  // --- triagem -------------------------------------------------------------
  triageProfessionalId: string | null;
  triageProfessionalName: string | null;
  /** Observações registadas pelo profissional de triagem. */
  triageObservations: string;
  triagedAt: string | null;
  triageOutcome: TriageOutcome | null;
  /** Alterações de prioridade, sempre justificadas. */
  priorityHistory: PriorityChange[];

  // --- atribuição ----------------------------------------------------------
  /** Pediatra indicado como preferência pelo encarregado (§7). */
  preferredDoctorId: string | null;
  preferredDoctorName: string | null;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
  /** Quem, na administração, atribuiu o pedido. */
  assignedById: string | null;
  assignedByName: string | null;
  assignedAt: string | null;
  /** Nota administrativa da atribuição (ex.: preferência indisponível). */
  assignmentNote: string;
  /** Momento em que o pediatra confirmou ter analisado a triagem. */
  reviewedAt: string | null;

  // --- agendamento ---------------------------------------------------------
  scheduledAt: string | null;
  /** Duração prevista, em minutos. */
  durationMinutes: number | null;
  /** Observações do agendamento. */
  schedulingNotes: string;
  scheduleHistory: ScheduleChange[];
  /** Link da sala, gerado apenas quando a modalidade é vídeo. */
  meetingLink: string | null;
  meetingLinkExpiresAt: string | null;
  /**
   * Momento da última notificação simulada com o acesso à sala. Enquanto não
   * existir integração externa não se afirma que foi enviado um SMS (§9).
   */
  accessNotifiedAt: string | null;

  // --- registo clínico -----------------------------------------------------
  clinicalNotes: string;
  /** Orientação clínica entregue ao encarregado. */
  guidance: string;
  prescriptions: Prescription[];
  referralReason: string;
  attachments: Attachment[];
  messages: ChatMessage[];
  /** Acessos excepcionais ao processo clínico, para efeitos de auditoria. */
  accessLog: AccessLogEntry[];
  /** Registo das acções importantes sobre o pedido. */
  timeline: TimelineEntry[];
  closedAt: string | null;
  cancelReason: string;
  /** Marca os registos de demonstração, realinhados ao dia actual. */
  seeded?: boolean;
};

/** Estados encerrados — o acesso à sala deixa de ser válido. */
export const closedStatuses: ConsultationStatus[] = [
  "CONSULTA_CONCLUIDA",
  "ENCAMINHADO_PRESENCIAL",
  "CANCELADO",
];

/** Estados em que um pedido ainda está em aberto (bloqueia duplicados). */
export const openStatuses: ConsultationStatus[] = [
  "SUBMETIDO",
  "AGUARDA_TRIAGEM",
  "TRIAGEM_CONCLUIDA",
  "AGUARDA_ATRIBUICAO",
  "PEDIATRA_ATRIBUIDO",
  "AGUARDA_AGENDAMENTO",
  "CONSULTA_AGENDADA",
  "CONSULTA_EM_CURSO",
];

/** Pedidos à espera de triagem. */
export const triageQueueStatuses: ConsultationStatus[] = [
  "SUBMETIDO",
  "AGUARDA_TRIAGEM",
];

/** Pedidos já triados e à espera de um pediatra. */
export const assignmentQueueStatuses: ConsultationStatus[] = [
  "TRIAGEM_CONCLUIDA",
  "AGUARDA_ATRIBUICAO",
];

/** Pedidos atribuídos e ainda sem horário. */
export const schedulingQueueStatuses: ConsultationStatus[] = [
  "PEDIATRA_ATRIBUIDO",
  "AGUARDA_AGENDAMENTO",
];

export function isClosed(status: ConsultationStatus) {
  return closedStatuses.includes(status);
}

export function isOpenStatus(status: ConsultationStatus) {
  return openStatuses.includes(status);
}

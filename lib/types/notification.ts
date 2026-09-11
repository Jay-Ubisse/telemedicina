import type { UserRole } from "./user";

/**
 * Notificação interna (§9 do relatório).
 *
 * Enquanto não existir integração externa, todas as notificações são
 * identificadas como «Notificação simulada» — nunca como «SMS enviado».
 */
export type NotificationKind =
  | "PEDIDO_RECEBIDO"
  | "TRIAGEM_CONCLUIDA"
  | "PRIORIDADE_ALTERADA"
  | "PEDIDO_ATRIBUIDO"
  | "AGENDAMENTO_CRIADO"
  | "AGENDAMENTO_ALTERADO"
  | "PEDIDO_ALTERACAO"
  | "CONSULTA_PROXIMA"
  | "CONSULTA_CONCLUIDA"
  | "ORIENTACAO_DISPONIVEL"
  | "PRESCRICAO_DISPONIVEL"
  | "ENCAMINHAMENTO"
  | "CANCELAMENTO"
  | "ACTUALIZACAO";

export const notificationKindLabels: Record<NotificationKind, string> = {
  PEDIDO_RECEBIDO: "Pedido recebido",
  TRIAGEM_CONCLUIDA: "Triagem concluída",
  PRIORIDADE_ALTERADA: "Alteração de prioridade",
  PEDIDO_ATRIBUIDO: "Pedido atribuído",
  AGENDAMENTO_CRIADO: "Agendamento criado",
  AGENDAMENTO_ALTERADO: "Agendamento alterado",
  PEDIDO_ALTERACAO: "Pedido de alteração",
  CONSULTA_PROXIMA: "Consulta a aproximar-se",
  CONSULTA_CONCLUIDA: "Consulta concluída",
  ORIENTACAO_DISPONIVEL: "Orientação disponível",
  PRESCRICAO_DISPONIVEL: "Prescrição disponível",
  ENCAMINHAMENTO: "Encaminhamento presencial",
  CANCELAMENTO: "Cancelamento",
  ACTUALIZACAO: "Actualização relevante",
};

/** Etiqueta obrigatória: não há envio real nesta demonstração. */
export const SIMULATED_NOTIFICATION_LABEL = "Notificação simulada";

export type AppNotification = {
  id: string;
  /** Destinatário individual. */
  userId: string;
  /** Perfil do destinatário, para separar as caixas por painel. */
  role: UserRole;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  consultationId: string | null;
  reference: string | null;
};

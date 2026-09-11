import type { Consultation } from "../types/consultation";
import {
  channelLabels,
  priorityLabels,
  statusLabels,
} from "../types/consultation";
import type { NotificationKind } from "../types/notification";
import { formatDateTime } from "../utils/date";

/**
 * Texto das notificações internas (§9 do relatório).
 *
 * Vive num módulo próprio porque é usado nos dois sentidos: pelas acções da
 * store, quando um evento acontece de facto, e pelos dados de demonstração, que
 * reconstroem o histórico de notificações dos pedidos semeados. Assim a
 * demonstração e o comportamento real dizem exactamente a mesma coisa.
 */
export type NotificationDraft = {
  kind: NotificationKind;
  title: string;
  body: string;
};

const ref = (consultation: Consultation) => consultation.reference;

export const notificationMessages = {
  // --- encarregado --------------------------------------------------------
  guardianRequestReceived(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_RECEBIDO",
      title: `Pedido ${ref(consultation)} recebido`,
      body: `O pedido para ${consultation.childName} foi recebido e está a aguardar triagem por um profissional de saúde do HGM.`,
    };
  },

  guardianTriageConcluded(consultation: Consultation): NotificationDraft {
    return {
      kind: "TRIAGEM_CONCLUIDA",
      title: `Triagem concluída — ${ref(consultation)}`,
      body:
        consultation.triageOutcome === "PRESENCIAL"
          ? `A triagem do pedido ${ref(consultation)} foi concluída e o caso foi encaminhado para atendimento presencial.`
          : `A triagem do pedido ${ref(consultation)} foi concluída com a prioridade ${priorityLabels[
              consultation.priority
            ].toLowerCase()}. O pedido segue para atribuição de um pediatra.`,
    };
  },

  /**
   * Sem pediatra disponível, o pedido fica em espera. O encarregado tem de saber
   * que o pedido não parou — está à espera de uma data.
   */
  guardianWaitingAssignment(
    consultation: Consultation,
    note: string,
  ): NotificationDraft {
    return {
      kind: "ACTUALIZACAO",
      title: `Pedido em espera — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} está triado e a aguardar a disponibilidade de um pediatra. ${note}`,
    };
  },

  guardianAssigned(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_ATRIBUIDO",
      title: `Pediatra atribuído — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} foi atribuído a ${consultation.assignedDoctorName}. Receberá a informação do agendamento assim que o horário for definido.`,
    };
  },

  guardianScheduled(consultation: Consultation): NotificationDraft {
    return {
      kind: "AGENDAMENTO_CRIADO",
      title: `Consulta agendada — ${ref(consultation)}`,
      body: `A teleconsulta de ${consultation.childName} está marcada para ${formatDateTime(
        consultation.scheduledAt!,
      )}, por ${channelLabels[consultation.channel].toLowerCase()}, com ${consultation.assignedDoctorName}.`,
    };
  },

  guardianRescheduled(
    consultation: Consultation,
    reason: string,
  ): NotificationDraft {
    return {
      kind: "AGENDAMENTO_ALTERADO",
      title: `Agendamento alterado — ${ref(consultation)}`,
      body: `A teleconsulta de ${consultation.childName} passou para ${formatDateTime(
        consultation.scheduledAt!,
      )}. Motivo: ${reason}`,
    };
  },

  guardianGuidance(consultation: Consultation): NotificationDraft {
    return {
      kind: "ORIENTACAO_DISPONIVEL",
      title: `Orientação disponível — ${ref(consultation)}`,
      body: `A teleconsulta de ${consultation.childName} foi concluída. A orientação clínica já está disponível na plataforma.`,
    };
  },

  guardianPrescription(consultation: Consultation): NotificationDraft {
    return {
      kind: "PRESCRICAO_DISPONIVEL",
      title: `Prescrição disponível — ${ref(consultation)}`,
      body: `${consultation.assignedDoctorName} registou uma prescrição demonstrativa para ${consultation.childName}. Consulte-a no pedido ${ref(consultation)}.`,
    };
  },

  guardianReferred(consultation: Consultation): NotificationDraft {
    return {
      kind: "ENCAMINHAMENTO",
      title: `Encaminhamento presencial — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} foi encaminhado para atendimento presencial. ${consultation.referralReason}`,
    };
  },

  guardianCancelled(consultation: Consultation): NotificationDraft {
    return {
      kind: "CANCELAMENTO",
      title: `Pedido cancelado — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} para ${consultation.childName} foi cancelado.${
        consultation.cancelReason ? ` Motivo: ${consultation.cancelReason}` : ""
      }`,
    };
  },

  // --- profissional de triagem --------------------------------------------
  triageNewRequest(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_RECEBIDO",
      title: `Novo pedido para triagem — ${ref(consultation)}`,
      body: `Entrou um pedido de ${consultation.source === "USSD" ? "canal USSD" : "plataforma web"} para uma criança de ${consultation.childAgeYears} anos. Analise os sintomas e atribua a prioridade.`,
    };
  },

  triagePriorityChanged(
    consultation: Consultation,
    justification: string,
  ): NotificationDraft {
    return {
      kind: "PRIORIDADE_ALTERADA",
      title: `Prioridade alterada — ${ref(consultation)}`,
      body: `A prioridade do pedido ${ref(consultation)} passou a ${priorityLabels[
        consultation.priority
      ].toLowerCase()}. Justificação: ${justification}`,
    };
  },

  // --- administrativo -----------------------------------------------------
  adminNewRequest(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_RECEBIDO",
      title: `Novo pedido — ${ref(consultation)}`,
      body: `Pedido registado por ${consultation.source === "USSD" ? "USSD" : "web"} e encaminhado para triagem.`,
    };
  },

  adminTriageConcluded(consultation: Consultation): NotificationDraft {
    return {
      kind: "TRIAGEM_CONCLUIDA",
      title: `Triagem concluída — ${ref(consultation)}`,
      body:
        consultation.triageOutcome === "PRESENCIAL"
          ? `${consultation.triageProfessionalName} encaminhou o pedido ${ref(consultation)} para atendimento presencial.`
          : `${consultation.triageProfessionalName} concluiu a triagem do pedido ${ref(consultation)} com prioridade ${priorityLabels[
              consultation.priority
            ].toLowerCase()}. Consulte a disponibilidade e atribua um pediatra.`,
    };
  },

  adminAssigned(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_ATRIBUIDO",
      title: `Pedido atribuído — ${ref(consultation)}`,
      body: `${consultation.assignedByName} atribuiu o pedido ${ref(consultation)} a ${consultation.assignedDoctorName}.`,
    };
  },

  adminScheduled(consultation: Consultation): NotificationDraft {
    return {
      kind: "AGENDAMENTO_CRIADO",
      title: `Agendamento criado — ${ref(consultation)}`,
      body: `${consultation.assignedDoctorName} marcou o pedido ${ref(consultation)} para ${formatDateTime(
        consultation.scheduledAt!,
      )} (${channelLabels[consultation.channel].toLowerCase()}).`,
    };
  },

  adminRescheduled(
    consultation: Consultation,
    reason: string,
  ): NotificationDraft {
    return {
      kind: "AGENDAMENTO_ALTERADO",
      title: `Agendamento alterado — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} passou para ${formatDateTime(
        consultation.scheduledAt!,
      )}. Motivo: ${reason}`,
    };
  },

  adminCompleted(consultation: Consultation): NotificationDraft {
    return {
      kind: "CONSULTA_CONCLUIDA",
      title: `Consulta concluída — ${ref(consultation)}`,
      body: `${consultation.assignedDoctorName} concluiu a teleconsulta do pedido ${ref(consultation)}.`,
    };
  },

  adminReferred(consultation: Consultation): NotificationDraft {
    return {
      kind: "ENCAMINHAMENTO",
      title: `Encaminhamento presencial — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} foi encaminhado para atendimento presencial.`,
    };
  },

  adminCancelled(consultation: Consultation): NotificationDraft {
    return {
      kind: "CANCELAMENTO",
      title: `Pedido cancelado — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} foi cancelado e deixou de constar das filas de trabalho.`,
    };
  },

  // --- pediatra -----------------------------------------------------------
  /**
   * Redacção pedida no relatório (§7): «Foi-lhe atribuído o pedido R-1042,
   * classificado como urgente. Consulte os dados da triagem e defina o horário
   * do atendimento.»
   */
  doctorAssigned(consultation: Consultation): NotificationDraft {
    return {
      kind: "PEDIDO_ATRIBUIDO",
      title: `Pedido atribuído — ${ref(consultation)}`,
      body: `Foi-lhe atribuído o pedido ${ref(consultation)}, classificado como ${priorityLabels[
        consultation.priority
      ].toLowerCase()}. Consulte os dados da triagem e defina o horário do atendimento.`,
    };
  },

  doctorPriorityChanged(
    consultation: Consultation,
    justification: string,
  ): NotificationDraft {
    return {
      kind: "PRIORIDADE_ALTERADA",
      title: `Alteração de prioridade — ${ref(consultation)}`,
      body: `A triagem alterou a prioridade do pedido ${ref(consultation)} para ${priorityLabels[
        consultation.priority
      ].toLowerCase()}. Justificação: ${justification}`,
    };
  },

  doctorChangeRequest(
    consultation: Consultation,
    reason: string,
  ): NotificationDraft {
    return {
      kind: "PEDIDO_ALTERACAO",
      title: `Pedido de alteração — ${ref(consultation)}`,
      body: `O encarregado de ${consultation.childName} pediu a alteração do agendamento do pedido ${ref(consultation)}. Motivo: ${reason}`,
    };
  },

  doctorRelevantUpdate(
    consultation: Consultation,
    detail: string,
  ): NotificationDraft {
    return {
      kind: "ACTUALIZACAO",
      title: `Actualização relevante — ${ref(consultation)}`,
      body: `${detail} (pedido ${ref(consultation)}, estado ${statusLabels[
        consultation.status
      ].toLowerCase()}).`,
    };
  },

  doctorUpcoming(consultation: Consultation): NotificationDraft {
    return {
      kind: "CONSULTA_PROXIMA",
      title: `Consulta a aproximar-se — ${ref(consultation)}`,
      body: `A teleconsulta de ${consultation.childName} está marcada para ${formatDateTime(
        consultation.scheduledAt!,
      )}. Prepare a sala de atendimento.`,
    };
  },

  doctorRescheduled(
    consultation: Consultation,
    reason: string,
  ): NotificationDraft {
    return {
      kind: "AGENDAMENTO_ALTERADO",
      title: `Agendamento alterado — ${ref(consultation)}`,
      body: `O pedido ${ref(consultation)} passou para ${formatDateTime(
        consultation.scheduledAt!,
      )}. Motivo: ${reason}`,
    };
  },
};

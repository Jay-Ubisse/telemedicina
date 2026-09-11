import type {
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
  ConsultationStatus,
} from "../types/consultation";
import {
  assignmentQueueStatuses,
  closedStatuses,
  openStatuses,
  schedulingQueueStatuses,
  triageQueueStatuses,
} from "../types/consultation";
import type { User } from "../types/user";
import { isToday, minutesUntil } from "./date";

export type ConsultationFilters = {
  search: string;
  status: ConsultationStatus | "TODOS";
  priority: ConsultationPriority | "TODOS";
  channel: ConsultationChannel | "TODOS";
  source: "TODOS" | "USSD" | "WEB";
};

export const defaultFilters: ConsultationFilters = {
  search: "",
  status: "TODOS",
  priority: "TODOS",
  channel: "TODOS",
  source: "TODOS",
};

export function filterConsultations(
  data: Consultation[],
  filters: ConsultationFilters,
) {
  const search = filters.search.trim().toLowerCase();

  return data.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.childName.toLowerCase().includes(search) ||
      item.guardianName.toLowerCase().includes(search) ||
      item.phone.toLowerCase().includes(search) ||
      item.reference.toLowerCase().includes(search) ||
      item.symptoms.some((symptom) => symptom.toLowerCase().includes(search));

    const matchesStatus =
      filters.status === "TODOS" || item.status === filters.status;
    const matchesPriority =
      filters.priority === "TODOS" || item.priority === filters.priority;
    const matchesChannel =
      filters.channel === "TODOS" || item.channel === filters.channel;
    const matchesSource =
      filters.source === "TODOS" || item.source === filters.source;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesChannel &&
      matchesSource
    );
  });
}

/**
 * Ordem da fila de trabalho: crítico primeiro, depois urgente, depois os
 * pedidos ainda sem triagem (que são precisamente os que esperam por decisão) e
 * por fim os normais. Dentro do mesmo nível, manda a hora de chegada.
 */
const priorityWeight: Record<ConsultationPriority, number> = {
  CRITICA: 0,
  URGENTE: 1,
  SEM_TRIAGEM: 2,
  NORMAL: 3,
};

export function sortByPriority(data: Consultation[]) {
  return [...data].sort((a, b) => {
    const weight = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (weight !== 0) return weight;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/** Fila de triagem: pela ordem de chegada, o mais antigo primeiro. */
export function sortByArrival(data: Consultation[]) {
  return [...data].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function sortByCreatedDesc(data: Consultation[]) {
  return [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sortByScheduled(data: Consultation[]) {
  return [...data].sort((a, b) => {
    const first = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
    const second = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
    return first - second;
  });
}

/**
 * Agenda do dia.
 *
 * O protótipo anterior listava qualquer registo, independentemente do dia e da
 * hora — abrir o painel às 08:00 mostrava uma consulta "de hoje" marcada para
 * as 22:00 do dia anterior. Aqui só entram consultas efectivamente agendadas
 * para hoje, separadas entre as que ainda estão por realizar e as que já
 * passaram.
 */
export function getTodayAgenda(data: Consultation[]) {
  const todayScheduled = data.filter(
    (item) => item.scheduledAt !== null && isToday(item.scheduledAt),
  );

  const ordered = sortByScheduled(todayScheduled);

  const upcoming = ordered.filter(
    (item) =>
      item.status === "CONSULTA_EM_CURSO" ||
      (openStatuses.includes(item.status) &&
        minutesUntil(item.scheduledAt!) >= -15),
  );

  const past = ordered.filter((item) => !upcoming.includes(item));

  return { all: ordered, upcoming, past };
}

/** Pedidos à espera de triagem, pela ordem de chegada. */
export function getTriageQueue(data: Consultation[]) {
  return sortByArrival(
    data.filter((item) => triageQueueStatuses.includes(item.status)),
  );
}

/** Pedidos triados à espera de pediatra, pela prioridade atribuída. */
export function getAssignmentQueue(data: Consultation[]) {
  return sortByPriority(
    data.filter((item) => assignmentQueueStatuses.includes(item.status)),
  );
}

/** Pedidos atribuídos e ainda sem horário. */
export function getSchedulingQueue(data: Consultation[]) {
  return sortByPriority(
    data.filter((item) => schedulingQueueStatuses.includes(item.status)),
  );
}

/** Casos urgentes e críticos ainda em aberto. */
export function getPriorityCases(data: Consultation[]) {
  return sortByPriority(
    data.filter(
      (item) =>
        (item.priority === "CRITICA" || item.priority === "URGENTE") &&
        openStatuses.includes(item.status),
    ),
  );
}

export function getNextConsultation(data: Consultation[]) {
  const candidates = data
    .filter((item) => item.scheduledAt && openStatuses.includes(item.status))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
    );

  return (
    candidates.find((item) => item.status === "CONSULTA_EM_CURSO") ??
    candidates[0]
  );
}

export function getMetrics(data: Consultation[]) {
  const today = getTodayAgenda(data);

  return {
    total: data.length,
    awaitingTriage: data.filter((item) =>
      triageQueueStatuses.includes(item.status),
    ).length,
    awaitingAssignment: data.filter((item) =>
      assignmentQueueStatuses.includes(item.status),
    ).length,
    awaitingScheduling: data.filter((item) =>
      schedulingQueueStatuses.includes(item.status),
    ).length,
    scheduled: data.filter((item) => item.status === "CONSULTA_AGENDADA").length,
    inProgress: data.filter((item) => item.status === "CONSULTA_EM_CURSO").length,
    completed: data.filter((item) => item.status === "CONSULTA_CONCLUIDA").length,
    referred: data.filter((item) => item.status === "ENCAMINHADO_PRESENCIAL")
      .length,
    cancelled: data.filter((item) => item.status === "CANCELADO").length,
    open: data.filter((item) => openStatuses.includes(item.status)).length,
    critical: data.filter((item) => item.priority === "CRITICA").length,
    /** Críticos que ainda exigem acção — alimenta o alerta do painel. */
    criticalOpen: data.filter(
      (item) => item.priority === "CRITICA" && openStatuses.includes(item.status),
    ).length,
    urgentOpen: data.filter(
      (item) => item.priority === "URGENTE" && openStatuses.includes(item.status),
    ).length,
    today: today.all.length,
    todayUpcoming: today.upcoming.length,
    video: data.filter((item) => item.channel === "VIDEO").length,
    audio: data.filter((item) => item.channel === "AUDIO").length,
    text: data.filter((item) => item.channel === "TEXTO").length,
    fromUssd: data.filter((item) => item.source === "USSD").length,
    withPrescription: data.filter((item) => item.prescriptions.length > 0).length,
  };
}

/** Volume de pedidos por dia nos últimos `days` dias (para o relatório). */
export function getDailyVolume(data: Consultation[], days = 7) {
  const buckets: {
    date: Date;
    label: string;
    total: number;
    urgent: number;
  }[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    buckets.push({
      date,
      label: date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
      }),
      total: 0,
      urgent: 0,
    });
  }

  for (const item of data) {
    const created = new Date(item.createdAt);
    created.setHours(0, 0, 0, 0);

    const bucket = buckets.find(
      (entry) => entry.date.getTime() === created.getTime(),
    );
    if (!bucket) continue;

    bucket.total += 1;
    if (item.priority === "URGENTE" || item.priority === "CRITICA") {
      bucket.urgent += 1;
    }
  }

  return buckets;
}

const priorityOrder: ConsultationPriority[] = [
  "CRITICA",
  "URGENTE",
  "NORMAL",
  "SEM_TRIAGEM",
];

/** Distribuição de pedidos por prioridade atribuída na triagem. */
export function getPriorityBreakdown(data: Consultation[]) {
  return priorityOrder.map((priority) => ({
    priority,
    total: data.filter((item) => item.priority === priority).length,
  }));
}

const channelOrder: ConsultationChannel[] = ["VIDEO", "AUDIO", "TEXTO"];

/** Distribuição de pedidos por modalidade de atendimento. */
export function getChannelBreakdown(data: Consultation[]) {
  return channelOrder.map((channel) => ({
    channel,
    total: data.filter((item) => item.channel === channel).length,
  }));
}

export function isOpen(consultation: Consultation) {
  return openStatuses.includes(consultation.status);
}

/** O acesso à sala só é válido até `meetingLinkExpiresAt`. */
export function isMeetingLinkValid(consultation: Consultation) {
  if (!consultation.meetingLink || !consultation.meetingLinkExpiresAt) {
    return false;
  }
  return new Date(consultation.meetingLinkExpiresAt).getTime() > Date.now();
}

export function symptomText(consultation: Consultation) {
  return (
    [...consultation.symptoms, consultation.otherSymptom]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

// ---------------------------------------------------------------------------
// Acção principal por perfil e fase (§3 do relatório)
// ---------------------------------------------------------------------------

export type PrimaryAction = {
  label: string;
  /** Separador a abrir no detalhe do pedido. */
  tab: string;
  /** Acção disponível ou apenas informativa? */
  enabled: boolean;
};

/**
 * O botão que cada perfil vê num pedido, conforme o estado:
 *
 * - «Realizar triagem» — apenas o profissional de triagem.
 * - «Atribuir pediatra» — o administrativo, depois da triagem.
 * - «Analisar pedido», «Definir horário», «Realizar consulta» e
 *   «Consultar registo» — o pediatra, conforme a fase do atendimento.
 */
export function primaryActionFor(
  user: User,
  consultation: Consultation,
): PrimaryAction {
  const closed = closedStatuses.includes(consultation.status);

  if (user.role === "TRIAGEM") {
    if (triageQueueStatuses.includes(consultation.status)) {
      return { label: "Realizar triagem", tab: "triagem", enabled: true };
    }
    return { label: "Consultar triagem", tab: "triagem", enabled: true };
  }

  if (user.role === "ADMINISTRATIVO") {
    if (assignmentQueueStatuses.includes(consultation.status)) {
      return { label: "Atribuir pediatra", tab: "atribuicao", enabled: true };
    }
    return { label: "Acompanhar pedido", tab: "pedido", enabled: true };
  }

  if (user.role === "PEDIATRA") {
    const mine = consultation.assignedDoctorId === user.id;
    if (!mine) return { label: "Abrir", tab: "pedido", enabled: true };

    if (consultation.status === "PEDIATRA_ATRIBUIDO") {
      return { label: "Analisar pedido", tab: "triagem", enabled: true };
    }
    if (consultation.status === "AGUARDA_AGENDAMENTO") {
      return { label: "Definir horário", tab: "agendamento", enabled: true };
    }
    if (
      consultation.status === "CONSULTA_AGENDADA" ||
      consultation.status === "CONSULTA_EM_CURSO"
    ) {
      return { label: "Realizar consulta", tab: "sala", enabled: true };
    }
    return { label: "Consultar registo", tab: "registo", enabled: true };
  }

  // Encarregado
  if (consultation.status === "CONSULTA_EM_CURSO") {
    return { label: "Entrar na consulta", tab: "sala", enabled: true };
  }
  if (closed) {
    return { label: "Ver orientações", tab: "registo", enabled: true };
  }
  return { label: "Acompanhar pedido", tab: "pedido", enabled: true };
}

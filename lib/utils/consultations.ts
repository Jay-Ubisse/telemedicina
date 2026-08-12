import type {
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
  ConsultationStatus,
} from "../types/consultation";
import { openStatuses } from "../types/consultation";
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

/** Fila de triagem: crítico primeiro, depois urgente, depois pela hora de chegada. */
const priorityWeight: Record<ConsultationPriority, number> = {
  CRITICA: 0,
  URGENTE: 1,
  AVALIACAO: 2,
  NORMAL: 3,
};

export function sortByTriage(data: Consultation[]) {
  return [...data].sort((a, b) => {
    const weight = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (weight !== 0) return weight;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
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
      item.status === "EM_CURSO" ||
      (openStatuses.includes(item.status) && minutesUntil(item.scheduledAt!) >= -15),
  );

  const past = ordered.filter((item) => !upcoming.includes(item));

  return { all: ordered, upcoming, past };
}

/** Pedidos ainda sem horário — a fila que o pediatra tem de triar. */
export function getPendingQueue(data: Consultation[]) {
  return sortByTriage(data.filter((item) => item.status === "PENDENTE"));
}

/** Casos urgentes e críticos ainda em aberto. */
export function getPriorityCases(data: Consultation[]) {
  return sortByTriage(
    data.filter(
      (item) =>
        (item.priority === "CRITICA" ||
          item.priority === "URGENTE" ||
          item.priority === "AVALIACAO") &&
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

  return candidates.find((item) => item.status === "EM_CURSO") ?? candidates[0];
}

export function getMetrics(data: Consultation[]) {
  const today = getTodayAgenda(data);

  return {
    pending: data.filter((item) => item.status === "PENDENTE").length,
    scheduled: data.filter((item) => item.status === "AGENDADA").length,
    inProgress: data.filter((item) => item.status === "EM_CURSO").length,
    completed: data.filter((item) => item.status === "CONCLUIDA").length,
    referred: data.filter((item) => item.status === "ENCAMINHADA").length,
    critical: data.filter((item) => item.priority === "CRITICA").length,
    /** Críticos que ainda exigem acção — alimenta o alerta do painel. */
    criticalOpen: data.filter(
      (item) => item.priority === "CRITICA" && openStatuses.includes(item.status),
    ).length,
    today: today.all.length,
    todayUpcoming: today.upcoming.length,
    video: data.filter((item) => item.channel === "VIDEO").length,
    fromUssd: data.filter((item) => item.source === "USSD").length,
  };
}

/** Volume de pedidos por dia nos últimos `days` dias (para o relatório). */
export function getDailyVolume(data: Consultation[], days = 7) {
  const buckets: { date: Date; label: string; total: number; urgent: number }[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    buckets.push({
      date,
      label: date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
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
  "AVALIACAO",
  "NORMAL",
];

/** Distribuição de pedidos por prioridade (para o relatório). */
export function getPriorityBreakdown(data: Consultation[]) {
  return priorityOrder.map((priority) => ({
    priority,
    total: data.filter((item) => item.priority === priority).length,
  }));
}

const channelOrder: ConsultationChannel[] = ["VIDEO", "VOZ"];

/** Distribuição de pedidos por canal de atendimento (para o relatório). */
export function getChannelBreakdown(data: Consultation[]) {
  return channelOrder.map((channel) => ({
    channel,
    total: data.filter((item) => item.channel === channel).length,
  }));
}

export function isOpen(consultation: Consultation) {
  return openStatuses.includes(consultation.status);
}

/** O link da videochamada só é válido até `meetingLinkExpiresAt`. */
export function isMeetingLinkValid(consultation: Consultation) {
  if (!consultation.meetingLink || !consultation.meetingLinkExpiresAt) return false;
  return new Date(consultation.meetingLinkExpiresAt).getTime() > Date.now();
}

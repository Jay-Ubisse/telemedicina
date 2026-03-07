import type { Teleconsultation } from "../types/teleconsultation";

export function getDashboardMetrics(data: Teleconsultation[]) {
  return {
    totalScheduled: data.filter((item) => item.status === "AGENDADA").length,
    inProgress: data.filter((item) => item.status === "EM_CURSO").length,
    completed: data.filter((item) => item.status === "CONCLUIDA").length,
    referred: data.filter((item) => item.referredToPresential).length,
  };
}

export function getPriorityConsultations(data: Teleconsultation[]) {
  return data.filter(
    (item) => item.priority === "URGENTE" || item.priority === "CRITICO",
  );
}

export function getTodayConsultations(data: Teleconsultation[]) {
  return [...data].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
}

export function getNextConsultation(data: Teleconsultation[]) {
  return [...data]
    .filter((item) => item.status === "AGENDADA" || item.status === "EM_CURSO")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )[0];
}

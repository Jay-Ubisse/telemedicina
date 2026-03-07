import type {
  ConsultationPriority,
  ConsultationStatus,
  Teleconsultation,
} from "../types/teleconsultation";

export type TeleconsultationFilters = {
  search: string;
  status: ConsultationStatus | "TODOS";
  priority: ConsultationPriority | "TODOS";
  referral: "TODOS" | "ENCAMINHADOS" | "NAO_ENCAMINHADOS";
};

export function filterTeleconsultations(
  data: Teleconsultation[],
  filters: TeleconsultationFilters,
) {
  return data.filter((item) => {
    const matchesSearch =
      filters.search.trim() === "" ||
      item.patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.phone.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "TODOS" || item.status === filters.status;

    const matchesPriority =
      filters.priority === "TODOS" || item.priority === filters.priority;

    const matchesReferral =
      filters.referral === "TODOS" ||
      (filters.referral === "ENCAMINHADOS" && item.referredToPresential) ||
      (filters.referral === "NAO_ENCAMINHADOS" && !item.referredToPresential);

    return matchesSearch && matchesStatus && matchesPriority && matchesReferral;
  });
}

export function sortTeleconsultationsByDate(data: Teleconsultation[]) {
  return [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getTeleconsultationOverview(data: Teleconsultation[]) {
  return {
    total: data.length,
    scheduled: data.filter((item) => item.status === "AGENDADA").length,
    inProgress: data.filter((item) => item.status === "EM_CURSO").length,
    critical: data.filter((item) => item.priority === "CRITICO").length,
  };
}

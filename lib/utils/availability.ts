import type {
  Availability,
  DoctorAvailabilityStatus,
} from "../types/availability";
import { isDoctorAvailable } from "../types/availability";
import type { Shift, User } from "../types/user";
import { shiftRanges } from "../types/user";

/**
 * Disponibilidade dos pediatras (§14 do relatório).
 *
 * O protótipo testado mostrava um pediatra do turno da tarde (13h00–19h00) como
 * disponível durante a manhã, porque a disponibilidade era um simples
 * interruptor. Aqui distinguem-se as cinco situações que o relatório exige:
 * conta activa, turno registado, disponibilidade no momento, disponibilidade
 * adicional e ausência ou indisponibilidade.
 *
 * Regra: um pediatra nunca aparece disponível fora do seu turno, salvo se tiver
 * registado uma disponibilidade adicional que cubra o momento.
 */

/** Minutos desde a meia-noite. */
export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

/** "13:30" → 810 */
export function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/** 810 → "13:30" */
export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** O turno cobre este momento? O turno da noite atravessa a meia-noite. */
export function shiftCovers(shift: Shift, reference: Date = new Date()) {
  const now = minutesOfDay(reference);
  const { start, end } = shiftRanges[shift];
  return start <= end ? now >= start && now < end : now >= start || now < end;
}

export function describeShiftWindow(shift: Shift) {
  const { start, end } = shiftRanges[shift];
  return `${formatMinutes(start)}–${formatMinutes(end)}`;
}

function isoDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** O registo de disponibilidade cobre este momento? */
export function availabilityCovers(
  entry: Availability,
  reference: Date = new Date(),
) {
  if (entry.state !== "ACTIVA") return false;
  if (entry.date !== isoDate(reference)) return false;

  const start = parseTime(entry.startTime);
  const end = parseTime(entry.endTime);
  if (start === null || end === null) return false;

  const now = minutesOfDay(reference);
  // Janelas que atravessam a meia-noite são válidas (ex.: 22:00–02:00).
  return start <= end ? now >= start && now < end : now >= start || now < end;
}

export function availabilityOfDoctor(
  availability: Availability[],
  doctorId: string,
) {
  return availability.filter((entry) => entry.doctorId === doctorId);
}

/**
 * Situação de um pediatra num dado momento. A ordem das verificações é a ordem
 * de precedência: uma ausência registada vence a disponibilidade adicional, que
 * por sua vez vence o turno.
 */
export function doctorAvailabilityStatus(
  doctor: User,
  availability: Availability[],
  reference: Date = new Date(),
): DoctorAvailabilityStatus {
  if (doctor.state !== "ACTIVA") return "CONTA_INACTIVA";

  const entries = availabilityOfDoctor(availability, doctor.id).filter((entry) =>
    availabilityCovers(entry, reference),
  );

  if (entries.some((entry) => entry.kind === "AUSENCIA")) return "AUSENTE";
  if (entries.some((entry) => entry.kind === "ADICIONAL")) {
    return "DISPONIVEL_ADICIONAL";
  }

  const onShift = doctor.shift ? shiftCovers(doctor.shift, reference) : false;
  if (!onShift) return "FORA_DE_TURNO";
  if (doctor.available === false) return "INDISPONIVEL";

  return "DISPONIVEL_TURNO";
}

export type DoctorAvailability = {
  doctor: User;
  status: DoctorAvailabilityStatus;
  available: boolean;
  /** Registos de disponibilidade que cobrem o momento. */
  activeEntries: Availability[];
  /** Próximos registos em vigor, para sugerir uma data alternativa. */
  upcomingEntries: Availability[];
};

export function describeDoctorAvailability(
  doctor: User,
  availability: Availability[],
  reference: Date = new Date(),
): DoctorAvailability {
  const status = doctorAvailabilityStatus(doctor, availability, reference);
  const own = availabilityOfDoctor(availability, doctor.id);

  return {
    doctor,
    status,
    available: isDoctorAvailable(status),
    activeEntries: own.filter((entry) => availabilityCovers(entry, reference)),
    upcomingEntries: own
      .filter(
        (entry) =>
          entry.state === "ACTIVA" &&
          entry.kind !== "AUSENCIA" &&
          slotStart(entry).getTime() > reference.getTime(),
      )
      .sort((a, b) => slotStart(a).getTime() - slotStart(b).getTime()),
  };
}

/** Momento de início de uma janela de disponibilidade. */
export function slotStart(entry: Availability) {
  const minutes = parseTime(entry.startTime) ?? 0;
  const date = new Date(`${entry.date}T00:00:00`);
  date.setMinutes(minutes);
  return date;
}

/** Momento de fim de uma janela de disponibilidade. */
export function slotEnd(entry: Availability) {
  const start = parseTime(entry.startTime) ?? 0;
  const end = parseTime(entry.endTime) ?? 0;
  const date = new Date(`${entry.date}T00:00:00`);
  date.setMinutes(end <= start ? end + 24 * 60 : end);
  return date;
}

/** Pediatras ordenados: primeiro os disponíveis, depois por nome. */
export function rankDoctorsByAvailability(
  doctors: User[],
  availability: Availability[],
  reference: Date = new Date(),
) {
  const order: Record<DoctorAvailabilityStatus, number> = {
    DISPONIVEL_TURNO: 0,
    DISPONIVEL_ADICIONAL: 1,
    FORA_DE_TURNO: 2,
    INDISPONIVEL: 3,
    AUSENTE: 4,
    CONTA_INACTIVA: 5,
  };

  return doctors
    .map((doctor) => describeDoctorAvailability(doctor, availability, reference))
    .sort((a, b) => {
      const delta = order[a.status] - order[b.status];
      if (delta !== 0) return delta;
      return a.doctor.name.localeCompare(b.doctor.name, "pt");
    });
}

/** Valida uma janela de disponibilidade antes de a guardar. */
export function validateAvailabilityWindow(input: {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}): { valid: boolean; error?: string } {
  if (!input.date) return { valid: false, error: "Indique o dia." };

  const start = parseTime(input.startTime);
  const end = parseTime(input.endTime);

  if (start === null) return { valid: false, error: "Indique a hora inicial." };
  if (end === null) return { valid: false, error: "Indique a hora final." };
  if (end === start) {
    return {
      valid: false,
      error: "A hora final tem de ser diferente da hora inicial.",
    };
  }

  const span = end > start ? end - start : 24 * 60 - start + end;
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5) {
    return {
      valid: false,
      error: "A duração prevista tem de ser de pelo menos 5 minutos.",
    };
  }
  if (input.durationMinutes > span) {
    return {
      valid: false,
      error: `A duração prevista (${input.durationMinutes} min) não cabe na janela indicada (${span} min).`,
    };
  }

  return { valid: true };
}

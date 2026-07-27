const LOCALE = "pt-PT";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLongDate(value: Date | string = new Date()) {
  return new Date(value).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Valor pronto para um <input type="datetime-local">. */
export function toDateTimeLocalValue(value: string | Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function isSameDay(a: string | Date, b: string | Date) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function isToday(value: string | Date) {
  return isSameDay(value, new Date());
}

export function startOfDay(value: string | Date = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addMinutes(value: string | Date, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

/** Diferença em dias inteiros entre duas datas (b - a). */
export function differenceInDays(a: string | Date, b: string | Date) {
  const first = startOfDay(a).getTime();
  const second = startOfDay(b).getTime();
  return Math.round((second - first) / 86_400_000);
}

export function ageInYears(birthDate: string, reference: Date = new Date()) {
  const birth = new Date(birthDate);
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDelta = reference.getMonth() - birth.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && reference.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
}

/** "3 anos", "1 ano", "8 meses" — bebés precisam da granularidade em meses. */
export function describeAge(birthDate: string, reference: Date = new Date()) {
  const years = ageInYears(birthDate, reference);

  if (years >= 1) {
    return years === 1 ? "1 ano" : `${years} anos`;
  }

  const birth = new Date(birthDate);
  let months =
    (reference.getFullYear() - birth.getFullYear()) * 12 +
    (reference.getMonth() - birth.getMonth());

  if (reference.getDate() < birth.getDate()) months -= 1;
  months = Math.max(months, 0);

  if (months === 0) return "recém-nascido";
  return months === 1 ? "1 mês" : `${months} meses`;
}

export function describeAgeYears(years: number) {
  if (years <= 0) return "menos de 1 ano";
  return years === 1 ? "1 ano" : `${years} anos`;
}

/** "Há 12 min", "Há 2 h", "Há 3 dias". */
export function timeAgo(value: string, reference: Date = new Date()) {
  const diffMs = reference.getTime() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;

  const days = Math.round(hours / 24);
  return days === 1 ? "Há 1 dia" : `Há ${days} dias`;
}

/** Minutos restantes até `value`; negativo quando já passou. */
export function minutesUntil(value: string, reference: Date = new Date()) {
  return Math.round((new Date(value).getTime() - reference.getTime()) / 60_000);
}

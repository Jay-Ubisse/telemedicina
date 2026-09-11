import {
  AGE_LIMIT_MESSAGE,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  PREVENTIVE_WARNING,
  preventiveAlertKeywords,
  preventiveAlertSymptoms,
} from "../data/symptoms";

/**
 * Recepção do pedido.
 *
 * Este módulo substituiu o antigo `lib/utils/triage.ts`, que classificava os
 * pedidos automaticamente em normal / urgente / crítico. O relatório proíbe
 * essa classificação (§2): aqui só se valida a idade e se decide se há motivo
 * para mostrar um aviso **preventivo** ao encarregado.
 */

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const alertSet = new Set(preventiveAlertSymptoms.map(normalize));
const alertKeywords = preventiveAlertKeywords.map(normalize);

/** Um sintoma que justifica o aviso preventivo — nunca uma prioridade. */
export function needsPreventiveWarning(symptom: string) {
  const value = normalize(symptom);
  if (value === "") return false;
  if (alertSet.has(value)) return true;
  return alertKeywords.some((keyword) => value.includes(keyword));
}

export type IntakeInput = {
  symptoms: string[];
  otherSymptom?: string;
};

export type IntakeScreening = {
  /** Mostrar o aviso preventivo? */
  showWarning: boolean;
  /** Texto do aviso preventivo, quando aplicável. */
  warning: string | null;
  /** Sintomas que desencadearam o aviso, para o explicar ao utilizador. */
  matched: string[];
};

export function screenIntake({
  symptoms,
  otherSymptom = "",
}: IntakeInput): IntakeScreening {
  const freeText = otherSymptom.trim();
  const candidates = freeText ? [...symptoms, freeText] : [...symptoms];
  const matched = candidates.filter(needsPreventiveWarning);

  return {
    showWarning: matched.length > 0,
    warning: matched.length > 0 ? PREVENTIVE_WARNING : null,
    matched,
  };
}

export type AgeValidation = { valid: boolean; error?: string };

/** O serviço é exclusivo para crianças dos 0 aos 15 anos. */
export function validateChildAge(age: number | string): AgeValidation {
  const value = typeof age === "string" ? Number(age.trim()) : age;

  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { valid: false, error: "Idade inválida. Digite apenas números." };
  }

  if (value < MIN_AGE_YEARS || value > MAX_AGE_YEARS) {
    return { valid: false, error: AGE_LIMIT_MESSAGE };
  }

  return { valid: true };
}

import {
  AGE_LIMIT_MESSAGE,
  CRITICAL_MESSAGE,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  NORMAL_MESSAGE,
  OTHER_SYMPTOM_MESSAGE,
  URGENT_MESSAGE,
  criticalSymptoms,
  mildSymptoms,
  urgentSymptoms,
} from "../data/symptoms";
import type {
  ConsultationPriority,
  ConsultationStatus,
} from "../types/consultation";

export type TriageResult = {
  priority: ConsultationPriority;
  /** Estado inicial do pedido: crítico entra logo como ENCAMINHADA. */
  status: ConsultationStatus;
  /** Mensagem apresentada ao encarregado no fim do pedido. */
  message: string;
  /** Sinaliza uma emergência para destaque visual. */
  isEmergency: boolean;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const criticalSet = new Set(criticalSymptoms.map(normalize));
const urgentSet = new Set(urgentSymptoms.map(normalize));
const mildSet = new Set(mildSymptoms.map(normalize));

/**
 * Palavras-chave usadas para apanhar emergências escritas em texto livre
 * na opção "Outro".
 */
const criticalKeywords = [
  "convuls",
  "falta de ar",
  "dificuldade para respirar",
  "dificuldade respirat",
  "nao respira",
  "perda de consciencia",
  "inconsciente",
  "desmaio",
  "sangramento intenso",
  "hemorragia",
  "dor abdominal muito forte",
];

export function isCriticalSymptom(symptom: string) {
  const value = normalize(symptom);
  if (criticalSet.has(value)) return true;
  return criticalKeywords.some((keyword) => value.includes(keyword));
}

export function isUrgentSymptom(symptom: string) {
  return urgentSet.has(normalize(symptom));
}

export function isMildSymptom(symptom: string) {
  return mildSet.has(normalize(symptom));
}

export type TriageInput = {
  symptoms: string[];
  otherSymptom?: string;
};

/**
 * Classifica um pedido segundo as regras clínicas do HGM.
 * Um sintoma crítico manda sempre, independentemente dos restantes.
 */
export function triage({ symptoms, otherSymptom = "" }: TriageInput): TriageResult {
  const freeText = otherSymptom.trim();
  const candidates = freeText ? [...symptoms, freeText] : [...symptoms];

  if (candidates.some(isCriticalSymptom)) {
    return {
      priority: "CRITICA",
      status: "ENCAMINHADA",
      message: CRITICAL_MESSAGE,
      isEmergency: true,
    };
  }

  if (candidates.some(isUrgentSymptom)) {
    return {
      priority: "URGENTE",
      status: "PENDENTE",
      message: URGENT_MESSAGE,
      isEmergency: false,
    };
  }

  const hasKnownMild = candidates.some(isMildSymptom);

  // Texto livre que não corresponde a nenhum sintoma catalogado precisa de
  // avaliação humana antes de receber prioridade.
  if (!hasKnownMild && (freeText !== "" || candidates.length === 0)) {
    return {
      priority: "AVALIACAO",
      status: "PENDENTE",
      message: OTHER_SYMPTOM_MESSAGE,
      isEmergency: false,
    };
  }

  return {
    priority: "NORMAL",
    status: "PENDENTE",
    message: NORMAL_MESSAGE,
    isEmergency: false,
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

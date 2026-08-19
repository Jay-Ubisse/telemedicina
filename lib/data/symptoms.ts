/**
 * Catálogo de sintomas e regras de triagem definidos em
 * `docs/relatorio.docx`.
 */

/** Sintomas leves → prioridade normal → teleconsulta. */
export const mildSymptoms = [
  "Febre",
  "Tosse",
  "Dor de garganta",
  "Diarreia",
  "Dor de cabeça",
  "Vómitos leves",
] as const;

/** Sintomas urgentes → prioridade urgente → teleconsulta prioritária. */
export const urgentSymptoms = [
  "Febre alta",
  "Dor abdominal forte",
  "Vómitos persistentes",
  "Fraqueza intensa",
] as const;

/** Sintomas críticos → encaminhamento imediato para unidade sanitária. */
export const criticalSymptoms = [
  "Convulsões",
  "Falta de ar",
  "Perda de consciência",
  "Sangramento intenso",
  "Dor abdominal muito forte",
] as const;

export const allSymptoms: string[] = [
  ...mildSymptoms,
  ...urgentSymptoms,
  ...criticalSymptoms,
];

/** Opção livre no fim do menu USSD e do formulário web. */
export const OTHER_SYMPTOM_LABEL = "Outro";

/** Menu numerado usado pelo simulador USSD (1..15, 16 = Outro). */
export const ussdSymptomMenu: { key: string; label: string }[] = [
  ...allSymptoms.map((label, index) => ({
    key: String(index + 1),
    label,
  })),
  { key: String(allSymptoms.length + 1), label: OTHER_SYMPTOM_LABEL },
];

/** Serviço exclusivo para crianças. */
export const MIN_AGE_YEARS = 0;
export const MAX_AGE_YEARS = 15;

export const AGE_LIMIT_MESSAGE =
  "Este serviço é destinado apenas a crianças dos 0 aos 15 anos. Por favor dirija-se à unidade de saúde mais próxima.";

export const CRITICAL_MESSAGE =
  "ATENÇÃO: Possível emergência. Dirija-se imediatamente à unidade sanitária mais próxima.";

export const OTHER_SYMPTOM_MESSAGE =
  "Sintoma registado. O pedido será analisado por um profissional de saúde — aguarde contacto para orientação ou marcação da consulta. Caso a criança apresente dificuldade para respirar, convulsões ou perda de consciência, dirija-se imediatamente à unidade de saúde mais próxima.";

export const URGENT_MESSAGE =
  "Pedido registado como urgente. Será priorizado pela equipa de pediatria do HGM.";

export const NORMAL_MESSAGE =
  "Pedido registado. A equipa do HGM vai avaliar e agendar a sua teleconsulta.";

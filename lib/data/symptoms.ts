/**
 * Catálogo de sintomas do pedido.
 *
 * A lista é deliberadamente plana e sem níveis de gravidade. O relatório é
 * explícito (§2): «a plataforma não deve realizar triagem clínica nem atribuir
 * automaticamente prioridades como "normal", "urgente" ou "crítico"». A
 * classificação é sempre atribuída por um profissional de triagem.
 */
export const symptomCatalogue = [
  "Febre",
  "Febre alta",
  "Tosse",
  "Dor de garganta",
  "Dificuldade em respirar",
  "Diarreia",
  "Vómitos",
  "Dor abdominal",
  "Dor de cabeça",
  "Manchas na pele",
  "Recusa alimentar",
  "Prostração ou fraqueza",
  "Convulsões",
  "Perda de consciência",
  "Sangramento",
] as const;

export const allSymptoms: string[] = [...symptomCatalogue];

/**
 * Sintomas que fazem aparecer um aviso preventivo.
 *
 * Não é triagem nem diagnóstico: é apenas a recomendação de procurar a unidade
 * sanitária mais próxima, como o relatório autoriza — «estes devem ser
 * identificados apenas como avisos preventivos».
 */
export const preventiveAlertSymptoms = [
  "Dificuldade em respirar",
  "Convulsões",
  "Perda de consciência",
  "Sangramento",
] as const;

/** Palavras-chave para apanhar o mesmo tipo de descrição em texto livre. */
export const preventiveAlertKeywords = [
  "convuls",
  "falta de ar",
  "dificuldade para respirar",
  "dificuldade em respirar",
  "dificuldade respirat",
  "nao respira",
  "não respira",
  "perda de consciencia",
  "perda de consciência",
  "inconsciente",
  "desmaio",
  "sangramento",
  "hemorragia",
] as const;

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

/**
 * Aviso de emergência com a redacção aprovada no relatório (§5). Usado em todos
 * os ecrãs que precisam desta ressalva — público e interno.
 */
export const EMERGENCY_NOTICE =
  "A telepediatria não substitui os serviços de emergência. Em caso de sintomas graves, dirija-se imediatamente à unidade sanitária mais próxima ou contacte os serviços de emergência oficialmente disponíveis.";

/** Aviso preventivo, apresentado quando o pedido descreve sintomas graves. */
export const PREVENTIVE_WARNING =
  "Aviso preventivo: os sintomas indicados podem exigir atendimento imediato. Este aviso não é uma triagem nem um diagnóstico. Em caso de sintomas graves, dirija-se imediatamente à unidade sanitária mais próxima ou contacte os serviços de emergência oficialmente disponíveis.";

/** Confirmação apresentada ao encarregado depois de submeter o pedido. */
export const SUBMISSION_MESSAGE =
  "Pedido submetido. Será analisado por um profissional de triagem do HGM, que define a prioridade e o seguimento do atendimento.";

/**
 * Nota sobre interoperabilidade, com a redacção aprovada (§5): nada é afirmado
 * como implementado.
 */
export const INTEROPERABILITY_NOTE =
  "A arquitetura poderá futuramente permitir a integração com sistemas de informação em saúde através de padrões de interoperabilidade, como HL7 e FHIR.";

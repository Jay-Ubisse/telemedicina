import type {
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
  ConsultationSource,
  ConsultationStatus,
  Prescription,
  PrescriptionRoute,
  PriorityChange,
  ScheduleChange,
  TimelineEntry,
  TriageOutcome,
} from "../types/consultation";
import { statusLabels } from "../types/consultation";
import type { Availability, AvailabilityKind } from "../types/availability";
import type { AppNotification } from "../types/notification";
import type { Child, User } from "../types/user";
import { ageInYears } from "../utils/date";
import { notificationMessages } from "./notification-messages";

/**
 * Data de referência dos dados de demonstração. Todos os registos semeados são
 * recalculados à volta do "agora" real assim que o browser hidrata (ver
 * `syncDemoDay` no clinic-store), para que o painel tenha sempre consultas do
 * próprio dia.
 */
export const SEED_ANCHOR = new Date("2026-09-11T09:00:00");

export const DEMO_PASSWORD = "demo1234";

export const seedUsers: User[] = [
  // --- encarregados de educação ------------------------------------------
  {
    id: "USR-001",
    name: "Ana Mondlane",
    email: "ana@exemplo.mz",
    password: DEMO_PASSWORD,
    role: "ENCARREGADO",
    phone: "+258 84 512 3390",
    idDocument: "110100234567B",
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-05-14T10:12:00",
  },
  {
    id: "USR-005",
    name: "Carla Nhaca",
    email: "carla@exemplo.mz",
    password: DEMO_PASSWORD,
    role: "ENCARREGADO",
    phone: "+258 82 771 4408",
    idDocument: "110100889123A",
    address: "Hulene B",
    state: "ACTIVA",
    createdAt: "2026-06-02T14:35:00",
  },
  {
    id: "USR-006",
    name: "Paulo Cossa",
    email: "paulo@exemplo.mz",
    password: DEMO_PASSWORD,
    role: "ENCARREGADO",
    phone: "+258 86 330 9812",
    idDocument: "110101445902C",
    address: "Costa do Sol",
    state: "ACTIVA",
    createdAt: "2026-06-20T09:05:00",
  },
  /**
   * Conta provisória criada por um pedido USSD de um número ainda não
   * registado. Não inicia sessão — serve para demonstrar a activação pedida no
   * §11 do relatório.
   */
  {
    id: "USR-011",
    name: "Rosa Macamo",
    email: "ussd-847771200@pendente.hgm.mz",
    password: "",
    role: "ENCARREGADO",
    phone: "+258 84 777 1200",
    address: "Laulane",
    state: "PROVISORIA",
    createdAt: "2026-09-09T18:40:00",
  },

  // --- profissionais de triagem ------------------------------------------
  {
    id: "USR-009",
    name: "Marta Bila",
    email: "triagem@hgm.mz",
    password: DEMO_PASSWORD,
    role: "TRIAGEM",
    phone: "+258 84 901 2240",
    specialty: "Enfermagem pediátrica · triagem",
    licenseNumber: "OE-2210",
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-02-17T08:00:00",
  },
  {
    id: "USR-010",
    name: "Rui Macuácua",
    email: "rui.triagem@hgm.mz",
    password: DEMO_PASSWORD,
    role: "TRIAGEM",
    phone: "+258 84 901 7781",
    specialty: "Enfermagem pediátrica · triagem",
    licenseNumber: "OE-2488",
    address: "Hulene A",
    state: "ACTIVA",
    createdAt: "2026-04-02T08:00:00",
  },

  // --- administrativo -----------------------------------------------------
  {
    id: "USR-003",
    name: "Administração HGM",
    email: "admin@hgm.mz",
    password: DEMO_PASSWORD,
    role: "ADMINISTRATIVO",
    phone: "+258 84 000 0000",
    specialty: "Secretaria clínica de pediatria",
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-01-08T08:00:00",
  },

  // --- pediatras ----------------------------------------------------------
  {
    id: "USR-002",
    name: "Dra. Sara Chissano",
    email: "sara@hgm.mz",
    password: DEMO_PASSWORD,
    role: "PEDIATRA",
    phone: "+258 84 900 1120",
    specialty: "Pediatria Geral",
    licenseNumber: "OM-4821",
    shift: "MANHA",
    available: true,
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-02-03T08:00:00",
  },
  {
    id: "USR-004",
    name: "Dr. João Sitoe",
    email: "joao@hgm.mz",
    password: DEMO_PASSWORD,
    role: "PEDIATRA",
    phone: "+258 84 900 4471",
    specialty: "Pediatria e Neonatologia",
    licenseNumber: "OM-3907",
    shift: "TARDE",
    available: true,
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-02-11T08:00:00",
  },
  {
    id: "USR-007",
    name: "Dr. Nelson Machava",
    email: "nelson@hgm.mz",
    password: DEMO_PASSWORD,
    role: "PEDIATRA",
    phone: "+258 84 900 7734",
    specialty: "Urgência pediátrica",
    licenseNumber: "OM-5140",
    shift: "NOITE",
    available: true,
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-03-05T08:00:00",
  },
  {
    id: "USR-008",
    name: "Dra. Inês Tembe",
    email: "ines@hgm.mz",
    password: DEMO_PASSWORD,
    role: "PEDIATRA",
    phone: "+258 84 900 8812",
    specialty: "Seguimento de casos não urgentes",
    licenseNumber: "OM-5288",
    shift: "TARDE",
    // Declarou-se indisponível no turno: tem uma ausência registada hoje.
    available: false,
    address: "Mavalane A",
    state: "ACTIVA",
    createdAt: "2026-03-19T08:00:00",
  },
];

export const seedChildren: Child[] = [
  {
    id: "CRI-001",
    guardianId: "USR-001",
    name: "Tiago Mondlane",
    birthDate: "2022-03-14",
    sex: "M",
    notes: "Asma ligeira. Usa broncodilatador em crises.",
    createdAt: "2026-05-14T10:20:00",
  },
  {
    id: "CRI-002",
    guardianId: "USR-001",
    name: "Luísa Mondlane",
    birthDate: "2019-06-02",
    sex: "F",
    notes: "Sem alergias conhecidas.",
    createdAt: "2026-05-14T10:24:00",
  },
  {
    id: "CRI-003",
    guardianId: "USR-005",
    name: "Maria José Nhaca",
    birthDate: "2023-01-19",
    sex: "F",
    notes: "Alergia a penicilina.",
    createdAt: "2026-06-02T14:41:00",
  },
  {
    id: "CRI-004",
    guardianId: "USR-005",
    name: "João Manuel Nhaca",
    birthDate: "2017-04-25",
    sex: "M",
    notes: "",
    createdAt: "2026-06-02T14:44:00",
  },
  {
    id: "CRI-005",
    guardianId: "USR-005",
    name: "Carlos Alberto Nhaca",
    birthDate: "2020-09-08",
    sex: "M",
    notes: "Epilepsia diagnosticada em 2025.",
    createdAt: "2026-06-02T14:47:00",
  },
  {
    id: "CRI-006",
    guardianId: "USR-006",
    name: "Elsa Cossa",
    birthDate: "2024-05-30",
    sex: "F",
    notes: "",
    createdAt: "2026-06-20T09:12:00",
  },
  {
    id: "CRI-007",
    guardianId: "USR-006",
    name: "Nelson Cossa",
    birthDate: "2015-02-11",
    sex: "M",
    notes: "",
    createdAt: "2026-06-20T09:15:00",
  },
  {
    id: "CRI-008",
    guardianId: "USR-011",
    name: "Hélder Macamo",
    birthDate: "2021-11-03",
    sex: "M",
    notes:
      "Registado automaticamente a partir de um pedido USSD — confirmar data de nascimento e sexo na activação da conta.",
    createdAt: "2026-09-09T18:41:00",
  },
];

function findUser(id: string) {
  return seedUsers.find((user) => user.id === id)!;
}

// ---------------------------------------------------------------------------
// Disponibilidade dos pediatras
// ---------------------------------------------------------------------------

type SeedAvailability = {
  id: string;
  doctorId: string;
  /** Dias a contar de hoje: 0 = hoje. */
  dayOffset: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  modality: ConsultationChannel;
  kind: AvailabilityKind;
  notes?: string;
};

/**
 * Escala semeada. Os turnos cobrem a janela registada de cada pediatra; há uma
 * disponibilidade adicional (Dra. Sara, ao fim da tarde, fora do seu turno da
 * manhã) e uma ausência (Dra. Inês), para demonstrar as distinções exigidas no
 * §14 do relatório.
 */
const seedAvailabilityTemplates: SeedAvailability[] = [
  {
    id: "DISP-001",
    doctorId: "USR-002",
    dayOffset: 0,
    startTime: "07:00",
    endTime: "13:00",
    durationMinutes: 20,
    modality: "VIDEO",
    kind: "TURNO",
    notes: "Turno da manhã, consultas de 20 minutos.",
  },
  {
    id: "DISP-002",
    doctorId: "USR-002",
    dayOffset: 0,
    startTime: "17:00",
    endTime: "19:00",
    durationMinutes: 20,
    modality: "AUDIO",
    kind: "ADICIONAL",
    notes: "Disponibilidade adicional fora do turno, para casos de seguimento.",
  },
  {
    id: "DISP-003",
    doctorId: "USR-004",
    dayOffset: 0,
    startTime: "13:00",
    endTime: "19:00",
    durationMinutes: 30,
    modality: "VIDEO",
    kind: "TURNO",
    notes: "Turno da tarde.",
  },
  {
    id: "DISP-004",
    doctorId: "USR-007",
    dayOffset: 0,
    startTime: "19:00",
    endTime: "23:59",
    durationMinutes: 25,
    modality: "AUDIO",
    kind: "TURNO",
    notes: "Turno da noite — urgência pediátrica.",
  },
  {
    id: "DISP-005",
    doctorId: "USR-008",
    dayOffset: 0,
    startTime: "13:00",
    endTime: "19:00",
    durationMinutes: 30,
    modality: "TEXTO",
    kind: "AUSENCIA",
    notes: "Ausência por formação interna.",
  },
  {
    id: "DISP-006",
    doctorId: "USR-002",
    dayOffset: 1,
    startTime: "07:00",
    endTime: "13:00",
    durationMinutes: 20,
    modality: "VIDEO",
    kind: "TURNO",
    notes: "",
  },
  {
    id: "DISP-007",
    doctorId: "USR-004",
    dayOffset: 1,
    startTime: "13:00",
    endTime: "19:00",
    durationMinutes: 30,
    modality: "VIDEO",
    kind: "TURNO",
    notes: "",
  },
  {
    id: "DISP-008",
    doctorId: "USR-008",
    dayOffset: 1,
    startTime: "13:00",
    endTime: "17:00",
    durationMinutes: 30,
    modality: "TEXTO",
    kind: "TURNO",
    notes: "Seguimento por mensagens de texto.",
  },
];

function isoDay(reference: Date, offset: number) {
  const date = new Date(reference);
  date.setDate(date.getDate() + offset);
  const tz = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

export function buildSeedAvailability(
  reference: Date = SEED_ANCHOR,
): Availability[] {
  return seedAvailabilityTemplates.map((template) => {
    const doctor = findUser(template.doctorId);

    return {
      id: template.id,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: isoDay(reference, template.dayOffset),
      startTime: template.startTime,
      endTime: template.endTime,
      durationMinutes: template.durationMinutes,
      modality: template.modality,
      state: "ACTIVA",
      kind: template.kind,
      notes: template.notes ?? "",
      createdAt: new Date(reference.getTime() - 86_400_000).toISOString(),
    } satisfies Availability;
  });
}

// ---------------------------------------------------------------------------
// Pedidos de demonstração
// ---------------------------------------------------------------------------

type SeedPrescription = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: PrescriptionRoute;
  recommendations: string;
};

type SeedConsultation = {
  id: string;
  reference: string;
  childId: string;
  /** Minutos relativos ao "agora" — negativo é passado. */
  createdOffset: number;
  scheduledOffset: number | null;
  durationMinutes?: number;
  schedulingNotes?: string;
  symptoms: string[];
  otherSymptom?: string;
  notes?: string;
  channel: ConsultationChannel;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  source: ConsultationSource;
  /** Triagem */
  triageProfessionalId?: string;
  triageOffset?: number;
  triageObservations?: string;
  triageOutcome?: TriageOutcome;
  priorityChange?: { from: ConsultationPriority; justification: string };
  /** Atribuição */
  preferredDoctorId?: string;
  doctorId?: string;
  assignedOffset?: number;
  assignmentNote?: string;
  reviewedOffset?: number;
  /** Registo clínico */
  clinicalNotes?: string;
  guidance?: string;
  referralReason?: string;
  cancelReason?: string;
  prescriptions?: SeedPrescription[];
  rescheduled?: { fromOffset: number; reason: string };
  attachments?: { name: string; kind: "IMAGEM" | "EXAME" | "DOCUMENTO" }[];
};

/**
 * Os pedidos semeados percorrem todos os estados da lista do §3, pela ordem em
 * que o relatório os apresenta, para que cada painel tenha trabalho real à
 * espera: triagem por fazer, atribuição por fazer, horário por definir,
 * consulta a decorrer, casos encerrados e um pedido cancelado.
 */
const seedConsultationTemplates: SeedConsultation[] = [
  // 2. Aguardando triagem
  {
    id: "TC-1045",
    reference: "R-1045",
    childId: "CRI-001",
    createdOffset: -12,
    scheduledOffset: null,
    symptoms: ["Febre alta", "Tosse"],
    notes: "Febre persistente de 38,5 °C, tosse seca e perda de apetite.",
    channel: "VIDEO",
    priority: "SEM_TRIAGEM",
    status: "AGUARDA_TRIAGEM",
    source: "USSD",
    attachments: [{ name: "termometro-38-5.jpg", kind: "IMAGEM" }],
  },
  {
    id: "TC-1044",
    reference: "R-1044",
    childId: "CRI-008",
    createdOffset: -48,
    scheduledOffset: null,
    symptoms: ["Diarreia", "Vómitos"],
    notes: "Pedido submetido por USSD a partir de um número não registado.",
    channel: "AUDIO",
    priority: "SEM_TRIAGEM",
    status: "AGUARDA_TRIAGEM",
    source: "USSD",
  },
  // 3. Triagem concluída
  {
    id: "TC-1043",
    reference: "R-1043",
    childId: "CRI-003",
    createdOffset: -96,
    scheduledOffset: null,
    symptoms: ["Dor abdominal", "Febre"],
    notes: "Dor abdominal desde a noite anterior, sem melhoria.",
    channel: "VIDEO",
    priority: "URGENTE",
    status: "TRIAGEM_CONCLUIDA",
    source: "WEB",
    triageProfessionalId: "USR-009",
    triageOffset: -70,
    triageObservations:
      "Criança reactiva, com dor localizada referida pela mãe. Sem sinais de desidratação descritos. Justifica teleconsulta prioritária.",
    triageOutcome: "TELECONSULTA",
  },
  // 4. Aguardando atribuição (preferência indisponível)
  {
    id: "TC-1042",
    reference: "R-1042",
    childId: "CRI-004",
    createdOffset: -140,
    scheduledOffset: null,
    symptoms: ["Dor de garganta"],
    notes: "Dificuldade em engolir há dois dias.",
    channel: "TEXTO",
    priority: "NORMAL",
    status: "AGUARDA_ATRIBUICAO",
    source: "WEB",
    preferredDoctorId: "USR-008",
    triageProfessionalId: "USR-010",
    triageOffset: -120,
    triageObservations:
      "Quadro compatível com seguimento não urgente. Encarregado indicou preferência pela Dra. Inês Tembe.",
    triageOutcome: "TELECONSULTA",
    assignmentNote:
      "A preferência indicada está ausente hoje. Pedido em espera por data disponível, conforme a regra da preferência sujeita à disponibilidade.",
  },
  // 5. Pediatra atribuído
  {
    id: "TC-1041",
    reference: "R-1041",
    childId: "CRI-006",
    createdOffset: -190,
    scheduledOffset: null,
    symptoms: ["Febre", "Recusa alimentar"],
    notes: "Bebé com febre desde ontem e a mamar pouco.",
    channel: "VIDEO",
    priority: "URGENTE",
    status: "PEDIATRA_ATRIBUIDO",
    source: "WEB",
    triageProfessionalId: "USR-009",
    triageOffset: -170,
    triageObservations:
      "Lactente com febre e redução da ingestão. Prioridade urgente pela idade.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-002",
    assignedOffset: -150,
  },
  // 6. Aguardando agendamento
  {
    id: "TC-1040",
    reference: "R-1040",
    childId: "CRI-002",
    createdOffset: -260,
    scheduledOffset: null,
    symptoms: ["Manchas na pele"],
    notes: "Manchas na barriga desde ontem, sem febre.",
    channel: "VIDEO",
    priority: "NORMAL",
    status: "AGUARDA_AGENDAMENTO",
    source: "USSD",
    triageProfessionalId: "USR-010",
    triageOffset: -240,
    triageObservations:
      "Sem sinais de alarme descritos. Teleconsulta regular para observação das lesões.",
    triageOutcome: "TELECONSULTA",
    priorityChange: {
      from: "URGENTE",
      justification:
        "Contacto telefónico com a encarregada esclareceu que não há febre nem prostração. Prioridade ajustada de urgente para normal.",
    },
    doctorId: "USR-004",
    assignedOffset: -220,
    reviewedOffset: -40,
  },
  // 7. Consulta agendada
  {
    id: "TC-1039",
    reference: "R-1039",
    childId: "CRI-007",
    createdOffset: -1_380,
    scheduledOffset: 95,
    durationMinutes: 30,
    schedulingNotes: "Ter o boletim de vacinas à mão.",
    symptoms: ["Tosse", "Dor de cabeça"],
    notes: "Tosse há uma semana, sem febre.",
    channel: "VIDEO",
    priority: "NORMAL",
    status: "CONSULTA_AGENDADA",
    source: "WEB",
    triageProfessionalId: "USR-009",
    triageOffset: -1_340,
    triageObservations: "Quadro respiratório alto, sem sinais de alarme.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-004",
    assignedOffset: -1_300,
    reviewedOffset: -1_200,
    rescheduled: {
      fromOffset: 35,
      reason:
        "Sobreposição com uma consulta presencial no serviço. Novo horário confirmado com a encarregada.",
    },
  },
  // 8. Consulta em curso
  {
    id: "TC-1038",
    reference: "R-1038",
    childId: "CRI-005",
    createdOffset: -1_500,
    scheduledOffset: -8,
    durationMinutes: 20,
    symptoms: ["Febre", "Prostração ou fraqueza"],
    notes: "Febre alta desde a madrugada.",
    channel: "VIDEO",
    priority: "URGENTE",
    status: "CONSULTA_EM_CURSO",
    source: "USSD",
    triageProfessionalId: "USR-009",
    triageOffset: -1_460,
    triageObservations:
      "Antecedentes de epilepsia. Prioridade urgente — vigiar o risco de convulsão febril.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-002",
    assignedOffset: -1_420,
    reviewedOffset: -1_380,
  },
  // 9. Consulta concluída (com prescrição)
  {
    id: "TC-1034",
    reference: "R-1034",
    childId: "CRI-001",
    createdOffset: -1_530,
    scheduledOffset: -1_440,
    durationMinutes: 20,
    symptoms: ["Diarreia"],
    notes: "Três dejecções líquidas desde ontem.",
    channel: "AUDIO",
    priority: "NORMAL",
    status: "CONSULTA_CONCLUIDA",
    source: "USSD",
    triageProfessionalId: "USR-010",
    triageOffset: -1_510,
    triageObservations: "Sem sinais de desidratação descritos pela mãe.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-002",
    assignedOffset: -1_500,
    reviewedOffset: -1_470,
    clinicalNotes:
      "Quadro de gastroenterite ligeira, sem sinais de desidratação. Criança reactiva e hidratada.",
    guidance:
      "Sais de reidratação oral após cada dejecção. Manter a alimentação habitual. Reavaliar em 48 horas ou antes se houver vómitos persistentes.",
    prescriptions: [
      {
        medication: "Sais de reidratação oral (SRO)",
        dosage: "1 saqueta diluída em 200 ml de água tratada",
        frequency: "Após cada dejecção líquida",
        duration: "3 dias",
        route: "ORAL",
        recommendations:
          "Oferecer em pequenas quantidades e com frequência. Não adoçar a solução.",
      },
    ],
  },
  {
    id: "TC-1030",
    reference: "R-1030",
    childId: "CRI-003",
    createdOffset: -2_940,
    scheduledOffset: -2_880,
    durationMinutes: 20,
    symptoms: ["Tosse", "Febre"],
    channel: "VIDEO",
    priority: "NORMAL",
    status: "CONSULTA_CONCLUIDA",
    source: "WEB",
    triageProfessionalId: "USR-009",
    triageOffset: -2_920,
    triageObservations: "Febre de 38 °C medida em casa, sem dificuldade respiratória.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-004",
    assignedOffset: -2_910,
    reviewedOffset: -2_900,
    clinicalNotes: "Infecção respiratória alta de provável etiologia viral.",
    guidance:
      "Paracetamol em caso de febre, hidratação abundante e repouso. Regressar se a febre persistir mais de três dias.",
    prescriptions: [
      {
        medication: "Paracetamol suspensão oral 120 mg/5 ml",
        dosage: "10 mg/kg por dose",
        frequency: "De 6 em 6 horas, em caso de febre",
        duration: "3 dias",
        route: "ORAL",
        recommendations:
          "Não exceder quatro administrações por dia. Alergia a penicilina registada na ficha da criança.",
      },
    ],
    attachments: [{ name: "raio-x-torax.pdf", kind: "EXAME" }],
  },
  {
    id: "TC-1026",
    reference: "R-1026",
    childId: "CRI-007",
    createdOffset: -5_800,
    scheduledOffset: -5_760,
    durationMinutes: 25,
    symptoms: [],
    otherSymptom: "Manchas na pele que não desaparecem",
    channel: "TEXTO",
    priority: "NORMAL",
    status: "CONSULTA_CONCLUIDA",
    source: "USSD",
    triageProfessionalId: "USR-010",
    triageOffset: -5_790,
    triageObservations:
      "Sintoma descrito em texto livre no menu USSD. Sem sinais de alarme — seguimento por mensagens.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-008",
    assignedOffset: -5_780,
    reviewedOffset: -5_770,
    clinicalNotes: "Dermatite de contacto após a utilização de um sabão novo.",
    guidance:
      "Suspender o produto e aplicar creme emoliente duas vezes ao dia durante uma semana.",
  },
  // 10. Encaminhado para atendimento presencial
  {
    id: "TC-1037",
    reference: "R-1037",
    childId: "CRI-005",
    createdOffset: -620,
    scheduledOffset: null,
    symptoms: ["Convulsões"],
    notes: "Convulsão de cerca de dois minutos, já terminada.",
    channel: "AUDIO",
    priority: "CRITICA",
    status: "ENCAMINHADO_PRESENCIAL",
    source: "USSD",
    triageProfessionalId: "USR-009",
    triageOffset: -610,
    triageObservations:
      "Episódio convulsivo em criança com epilepsia conhecida. Avaliação presencial imediata.",
    triageOutcome: "PRESENCIAL",
    referralReason:
      "Encaminhado pela triagem para o banco de urgência do HGM: episódio convulsivo com antecedentes de epilepsia.",
  },
  {
    id: "TC-1018",
    reference: "R-1018",
    childId: "CRI-002",
    createdOffset: -4_350,
    scheduledOffset: -4_320,
    durationMinutes: 20,
    symptoms: ["Dor abdominal"],
    channel: "VIDEO",
    priority: "URGENTE",
    status: "ENCAMINHADO_PRESENCIAL",
    source: "USSD",
    triageProfessionalId: "USR-010",
    triageOffset: -4_340,
    triageObservations: "Dor abdominal com mais de 12 horas de evolução.",
    triageOutcome: "TELECONSULTA",
    doctorId: "USR-002",
    assignedOffset: -4_335,
    reviewedOffset: -4_330,
    clinicalNotes:
      "Dor localizada na fossa ilíaca direita, com defesa à palpação descrita pela mãe.",
    referralReason:
      "Suspeita de apendicite — encaminhada para o banco de urgência do HGM para avaliação cirúrgica.",
  },
  // 11. Cancelado
  {
    id: "TC-1035",
    reference: "R-1035",
    childId: "CRI-006",
    createdOffset: -2_600,
    scheduledOffset: null,
    symptoms: ["Dor de cabeça"],
    notes: "Dor de cabeça ligeira ao fim do dia.",
    channel: "AUDIO",
    priority: "NORMAL",
    status: "CANCELADO",
    source: "WEB",
    triageProfessionalId: "USR-009",
    triageOffset: -2_580,
    triageObservations: "Sem sinais de alarme. Teleconsulta regular.",
    triageOutcome: "TELECONSULTA",
    cancelReason: "A criança ficou bem; o encarregado cancelou o pedido.",
  },
];

function offsetToIso(reference: Date, minutes: number) {
  return new Date(reference.getTime() + minutes * 60_000).toISOString();
}

function findChild(childId: string) {
  return seedChildren.find((child) => child.id === childId)!;
}

function meetingLinkFor(reference: string) {
  return `https://telemedicina.hgm.mz/sala/${reference}`;
}

/** Entrada da linha cronológica. */
function entry(
  id: string,
  status: ConsultationStatus,
  at: string,
  actor: { id: string | null; name: string; role: TimelineEntry["actorRole"] },
  detail = "",
): TimelineEntry {
  return {
    id,
    status,
    detail: detail || statusLabels[status],
    at,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
  };
}

/**
 * Materializa os pedidos de demonstração à volta de uma referência temporal.
 * Chamado com `SEED_ANCHOR` no arranque (determinístico para o SSR) e com a
 * hora real após a hidratação.
 */
export function buildSeedConsultations(
  reference: Date = SEED_ANCHOR,
): Consultation[] {
  return seedConsultationTemplates.map((template) => {
    const child = findChild(template.childId);
    const guardian = findUser(child.guardianId);
    const doctor = template.doctorId ? findUser(template.doctorId) : undefined;
    const preferred = template.preferredDoctorId
      ? findUser(template.preferredDoctorId)
      : undefined;
    const triageProfessional = template.triageProfessionalId
      ? findUser(template.triageProfessionalId)
      : undefined;
    const administrative = findUser("USR-003");

    const createdAt = offsetToIso(reference, template.createdOffset);
    const scheduledAt =
      template.scheduledOffset === null
        ? null
        : offsetToIso(reference, template.scheduledOffset);

    const usesVideo = template.channel === "VIDEO" && scheduledAt !== null;
    const closed =
      template.status === "CONSULTA_CONCLUIDA" ||
      template.status === "ENCAMINHADO_PRESENCIAL" ||
      template.status === "CANCELADO";

    const timeline: TimelineEntry[] = [
      entry(`${template.id}-TL-1`, "SUBMETIDO", createdAt, {
        id: guardian.id,
        name: guardian.name,
        role: "ENCARREGADO",
      }, `Pedido submetido por ${template.source === "USSD" ? "USSD (*123#)" : "plataforma web"}.`),
      entry(`${template.id}-TL-2`, "AGUARDA_TRIAGEM", createdAt, {
        id: null,
        name: "Plataforma",
        role: "SISTEMA",
      }, "Pedido colocado na fila de triagem."),
    ];

    const priorityHistory: PriorityChange[] = [];

    if (triageProfessional && template.triageOffset !== undefined) {
      const triagedAt = offsetToIso(reference, template.triageOffset);

      if (template.priorityChange) {
        priorityHistory.push({
          id: `${template.id}-PR-1`,
          from: template.priorityChange.from,
          to: template.priority,
          justification: template.priorityChange.justification,
          byId: triageProfessional.id,
          byName: triageProfessional.name,
          at: offsetToIso(reference, template.triageOffset + 15),
        });
      }

      timeline.push(
        entry(
          `${template.id}-TL-3`,
          "TRIAGEM_CONCLUIDA",
          triagedAt,
          {
            id: triageProfessional.id,
            name: triageProfessional.name,
            role: "TRIAGEM",
          },
          `Triagem concluída com prioridade ${template.priority.toLowerCase()}.`,
        ),
      );

      if (template.priorityChange) {
        timeline.push(
          entry(
            `${template.id}-TL-3b`,
            "TRIAGEM_CONCLUIDA",
            offsetToIso(reference, template.triageOffset + 15),
            {
              id: triageProfessional.id,
              name: triageProfessional.name,
              role: "TRIAGEM",
            },
            `Prioridade alterada de ${template.priorityChange.from.toLowerCase()} para ${template.priority.toLowerCase()}.`,
          ),
        );
      }

      if (template.triageOutcome === "TELECONSULTA") {
        timeline.push(
          entry(
            `${template.id}-TL-4`,
            "AGUARDA_ATRIBUICAO",
            triagedAt,
            { id: null, name: "Plataforma", role: "SISTEMA" },
            "Pedido disponível para atribuição de pediatra.",
          ),
        );
      }
    }

    if (doctor && template.assignedOffset !== undefined) {
      const assignedAt = offsetToIso(reference, template.assignedOffset);
      timeline.push(
        entry(
          `${template.id}-TL-5`,
          "PEDIATRA_ATRIBUIDO",
          assignedAt,
          {
            id: administrative.id,
            name: administrative.name,
            role: "ADMINISTRATIVO",
          },
          `Pedido atribuído a ${doctor.name}.`,
        ),
      );
    }

    if (template.reviewedOffset !== undefined && doctor) {
      timeline.push(
        entry(
          `${template.id}-TL-6`,
          "AGUARDA_AGENDAMENTO",
          offsetToIso(reference, template.reviewedOffset),
          { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
          "Triagem analisada pelo pediatra. Horário por definir.",
        ),
      );
    }

    const scheduleHistory: ScheduleChange[] = [];

    if (scheduledAt && doctor) {
      const firstScheduledAt = template.rescheduled
        ? offsetToIso(reference, template.rescheduled.fromOffset)
        : scheduledAt;

      timeline.push(
        entry(
          `${template.id}-TL-7`,
          "CONSULTA_AGENDADA",
          offsetToIso(
            reference,
            (template.reviewedOffset ?? template.createdOffset) + 10,
          ),
          { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
          `Horário definido para ${new Date(firstScheduledAt).toLocaleString("pt-PT")}.`,
        ),
      );

      if (template.rescheduled) {
        const changedAt = offsetToIso(
          reference,
          (template.reviewedOffset ?? template.createdOffset) + 30,
        );
        scheduleHistory.push({
          id: `${template.id}-SC-1`,
          previousScheduledAt: firstScheduledAt,
          newScheduledAt: scheduledAt,
          previousDurationMinutes: template.durationMinutes ?? 20,
          newDurationMinutes: template.durationMinutes ?? 20,
          reason: template.rescheduled.reason,
          byId: doctor.id,
          byName: doctor.name,
          at: changedAt,
        });

        timeline.push(
          entry(
            `${template.id}-TL-8`,
            "CONSULTA_AGENDADA",
            changedAt,
            { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
            `Agendamento actualizado. Motivo: ${template.rescheduled.reason}`,
          ),
        );
      }
    }

    if (template.status === "CONSULTA_EM_CURSO" && doctor && scheduledAt) {
      timeline.push(
        entry(
          `${template.id}-TL-9`,
          "CONSULTA_EM_CURSO",
          scheduledAt,
          { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
          "Teleconsulta iniciada.",
        ),
      );
    }

    const closedAt = closed
      ? offsetToIso(
          reference,
          (template.scheduledOffset ?? template.triageOffset ?? template.createdOffset) +
            25,
        )
      : null;

    if (template.status === "CONSULTA_CONCLUIDA" && doctor && closedAt) {
      timeline.push(
        entry(
          `${template.id}-TL-10`,
          "CONSULTA_EM_CURSO",
          scheduledAt ?? closedAt,
          { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
          "Teleconsulta iniciada.",
        ),
        entry(
          `${template.id}-TL-11`,
          "CONSULTA_CONCLUIDA",
          closedAt,
          { id: doctor.id, name: doctor.name, role: "PEDIATRA" },
          "Teleconsulta concluída e registo clínico preenchido.",
        ),
      );
    }

    if (template.status === "ENCAMINHADO_PRESENCIAL" && closedAt) {
      const actor = doctor ?? triageProfessional;
      timeline.push(
        entry(
          `${template.id}-TL-12`,
          "ENCAMINHADO_PRESENCIAL",
          closedAt,
          {
            id: actor?.id ?? null,
            name: actor?.name ?? "Plataforma",
            role: doctor ? "PEDIATRA" : "TRIAGEM",
          },
          template.referralReason ?? "Encaminhado para atendimento presencial.",
        ),
      );
    }

    if (template.status === "CANCELADO" && closedAt) {
      timeline.push(
        entry(
          `${template.id}-TL-13`,
          "CANCELADO",
          closedAt,
          { id: guardian.id, name: guardian.name, role: "ENCARREGADO" },
          template.cancelReason ?? "Pedido cancelado.",
        ),
      );
    }

    const prescriptions: Prescription[] = (template.prescriptions ?? []).map(
      (item, index) => ({
        id: `${template.id}-PRE-${index + 1}`,
        medication: item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        route: item.route,
        recommendations: item.recommendations,
        issuedAt: closedAt ?? createdAt,
        doctorId: doctor?.id ?? "",
        doctorName: doctor?.name ?? "",
        doctorLicenseNumber: doctor?.licenseNumber ?? "",
      }),
    );

    return {
      id: template.id,
      reference: template.reference,
      childId: child.id,
      childName: child.name,
      childAgeYears: ageInYears(child.birthDate, reference),
      guardianId: guardian.id,
      guardianName: guardian.name,
      phone: guardian.phone,
      location: guardian.address ?? "",
      symptoms: template.symptoms,
      otherSymptom: template.otherSymptom ?? "",
      notes: template.notes ?? "",
      channel: template.channel,
      priority: template.priority,
      status: template.status,
      source: template.source,
      createdAt,
      consentGivenAt: createdAt,

      triageProfessionalId: triageProfessional?.id ?? null,
      triageProfessionalName: triageProfessional?.name ?? null,
      triageObservations: template.triageObservations ?? "",
      triagedAt:
        template.triageOffset !== undefined
          ? offsetToIso(reference, template.triageOffset)
          : null,
      triageOutcome: template.triageOutcome ?? null,
      priorityHistory,

      preferredDoctorId: preferred?.id ?? null,
      preferredDoctorName: preferred?.name ?? null,
      assignedDoctorId: doctor?.id ?? null,
      assignedDoctorName: doctor?.name ?? null,
      assignedById: doctor ? administrative.id : null,
      assignedByName: doctor ? administrative.name : null,
      assignedAt:
        doctor && template.assignedOffset !== undefined
          ? offsetToIso(reference, template.assignedOffset)
          : null,
      assignmentNote: template.assignmentNote ?? "",
      reviewedAt:
        template.reviewedOffset !== undefined
          ? offsetToIso(reference, template.reviewedOffset)
          : null,

      scheduledAt,
      durationMinutes: scheduledAt ? (template.durationMinutes ?? 20) : null,
      schedulingNotes: template.schedulingNotes ?? "",
      scheduleHistory,
      meetingLink: usesVideo ? meetingLinkFor(template.reference) : null,
      meetingLinkExpiresAt:
        usesVideo && scheduledAt
          ? new Date(
              new Date(scheduledAt).getTime() + 10 * 60_000,
            ).toISOString()
          : null,
      accessNotifiedAt: usesVideo
        ? offsetToIso(reference, template.createdOffset + 4)
        : null,

      clinicalNotes: template.clinicalNotes ?? "",
      guidance: template.guidance ?? "",
      prescriptions,
      referralReason: template.referralReason ?? "",
      attachments: (template.attachments ?? []).map((attachment, index) => ({
        id: `${template.id}-ATT-${index + 1}`,
        name: attachment.name,
        kind: attachment.kind,
        addedAt: offsetToIso(reference, template.createdOffset + 1),
      })),
      messages:
        template.status === "CONSULTA_EM_CURSO"
          ? [
              {
                id: `${template.id}-MSG-1`,
                authorName: doctor?.name ?? "Equipa HGM",
                authorRole: "PEDIATRA" as const,
                text: "Bom dia. Já consigo ver e ouvir bem. O Carlos está a beber líquidos?",
                sentAt: offsetToIso(reference, -5),
              },
              {
                id: `${template.id}-MSG-2`,
                authorName: guardian.name,
                authorRole: "ENCARREGADO" as const,
                text: "Bom dia, doutora. Está a beber pouco desde a manhã.",
                sentAt: offsetToIso(reference, -4),
              },
            ]
          : [],
      accessLog: [],
      timeline: timeline.sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
      ),
      closedAt,
      cancelReason: template.cancelReason ?? "",
      seeded: true,
    } satisfies Consultation;
  });
}

// ---------------------------------------------------------------------------
// Notificações de demonstração
// ---------------------------------------------------------------------------

/**
 * Reconstrói o histórico de notificações dos pedidos semeados, usando
 * exactamente os mesmos textos que as acções reais produzem. Todas são
 * apresentadas como «Notificação simulada» — não há envio externo.
 */
export function buildSeedNotifications(
  consultations: Consultation[],
  users: User[] = seedUsers,
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const triageTeam = users.filter((user) => user.role === "TRIAGEM");
  const adminTeam = users.filter((user) => user.role === "ADMINISTRATIVO");

  let counter = 0;
  const push = (
    recipient: User,
    draft: { kind: AppNotification["kind"]; title: string; body: string },
    at: string,
    consultation: Consultation,
    read = true,
  ) => {
    counter += 1;
    notifications.push({
      id: `NOT-SEED-${counter}`,
      userId: recipient.id,
      role: recipient.role,
      kind: draft.kind,
      title: draft.title,
      body: draft.body,
      createdAt: at,
      readAt: read ? at : null,
      consultationId: consultation.id,
      reference: consultation.reference,
    });
  };

  for (const consultation of consultations) {
    const guardian = users.find((user) => user.id === consultation.guardianId);
    const doctor = users.find(
      (user) => user.id === consultation.assignedDoctorId,
    );
    const recent = new Date(consultation.createdAt).getTime() > Date.now() - 86_400_000;

    if (guardian && guardian.state === "ACTIVA") {
      push(
        guardian,
        notificationMessages.guardianRequestReceived(consultation),
        consultation.createdAt,
        consultation,
        !recent,
      );
    }
    for (const member of triageTeam) {
      push(
        member,
        notificationMessages.triageNewRequest(consultation),
        consultation.createdAt,
        consultation,
        consultation.triagedAt !== null,
      );
    }
    for (const member of adminTeam) {
      push(
        member,
        notificationMessages.adminNewRequest(consultation),
        consultation.createdAt,
        consultation,
        consultation.triagedAt !== null,
      );
    }

    if (consultation.triagedAt) {
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianTriageConcluded(consultation),
          consultation.triagedAt,
          consultation,
          consultation.assignedAt !== null,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminTriageConcluded(consultation),
          consultation.triagedAt,
          consultation,
          consultation.assignedAt !== null,
        );
      }
    }

    for (const change of consultation.priorityHistory) {
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.triagePriorityChanged(
            consultation,
            change.justification,
          ),
          change.at,
          consultation,
        );
      }
      if (doctor) {
        push(
          doctor,
          notificationMessages.doctorPriorityChanged(
            consultation,
            change.justification,
          ),
          change.at,
          consultation,
          false,
        );
      }
    }

    if (consultation.assignedAt && doctor) {
      push(
        doctor,
        notificationMessages.doctorAssigned(consultation),
        consultation.assignedAt,
        consultation,
        consultation.reviewedAt !== null,
      );
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianAssigned(consultation),
          consultation.assignedAt,
          consultation,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminAssigned(consultation),
          consultation.assignedAt,
          consultation,
        );
      }
    }

    if (consultation.scheduledAt) {
      const at = consultation.reviewedAt ?? consultation.createdAt;
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianScheduled(consultation),
          at,
          consultation,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminScheduled(consultation),
          at,
          consultation,
        );
      }

      // Consulta a aproximar-se: só faz sentido para o que ainda vai acontecer.
      if (
        doctor &&
        consultation.status === "CONSULTA_AGENDADA" &&
        new Date(consultation.scheduledAt).getTime() > Date.now()
      ) {
        push(
          doctor,
          notificationMessages.doctorUpcoming(consultation),
          new Date(Date.now() - 5 * 60_000).toISOString(),
          consultation,
          false,
        );
      }
    }

    for (const change of consultation.scheduleHistory) {
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianRescheduled(consultation, change.reason),
          change.at,
          consultation,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminRescheduled(consultation, change.reason),
          change.at,
          consultation,
        );
      }
    }

    if (consultation.status === "CONSULTA_CONCLUIDA" && consultation.closedAt) {
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianGuidance(consultation),
          consultation.closedAt,
          consultation,
        );
        if (consultation.prescriptions.length > 0) {
          push(
            guardian,
            notificationMessages.guardianPrescription(consultation),
            consultation.closedAt,
            consultation,
          );
        }
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminCompleted(consultation),
          consultation.closedAt,
          consultation,
        );
      }
    }

    if (
      consultation.status === "ENCAMINHADO_PRESENCIAL" &&
      consultation.closedAt
    ) {
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianReferred(consultation),
          consultation.closedAt,
          consultation,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminReferred(consultation),
          consultation.closedAt,
          consultation,
        );
      }
    }

    if (consultation.status === "CANCELADO" && consultation.closedAt) {
      if (guardian && guardian.state === "ACTIVA") {
        push(
          guardian,
          notificationMessages.guardianCancelled(consultation),
          consultation.closedAt,
          consultation,
        );
      }
      for (const member of adminTeam) {
        push(
          member,
          notificationMessages.adminCancelled(consultation),
          consultation.closedAt,
          consultation,
        );
      }
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Próximo número de referência disponível. */
export const SEED_REFERENCE_START = 1_046;

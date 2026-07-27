import type {
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
  ConsultationSource,
  ConsultationStatus,
} from "../types/consultation";
import type { Child, User } from "../types/user";
import { ageInYears } from "../utils/date";

/**
 * Data de referência dos dados de demonstração. Todos os registos semeados
 * são recalculados à volta do "agora" real assim que o browser hidrata
 * (ver `syncDemoDay` no clinic-store), para que o painel tenha sempre
 * consultas do próprio dia.
 */
export const SEED_ANCHOR = new Date("2026-07-27T09:00:00");

export const DEMO_PASSWORD = "demo1234";

export const seedUsers: User[] = [
  {
    id: "USR-001",
    name: "Ana Mondlane",
    email: "ana@exemplo.mz",
    password: DEMO_PASSWORD,
    role: "ENCARREGADO",
    phone: "+258 84 512 3390",
    idDocument: "110100234567B",
    address: "Mavalane A, Av. de Moçambique nº 421",
    active: true,
    createdAt: "2026-05-14T10:12:00",
  },
  {
    id: "USR-002",
    name: "Dra. Sara Chissano",
    email: "sara@hgm.mz",
    password: DEMO_PASSWORD,
    role: "PEDIATRA",
    phone: "+258 84 900 1120",
    specialty: "Pediatria Geral",
    licenseNumber: "OM-4821",
    address: "Hospital Geral de Mavalane",
    active: true,
    createdAt: "2026-02-03T08:00:00",
  },
  {
    id: "USR-003",
    name: "Joaquim Ubisse",
    email: "admin@hgm.mz",
    password: DEMO_PASSWORD,
    role: "ADMIN",
    phone: "+258 84 000 0000",
    specialty: "Direcção clínica",
    address: "Hospital Geral de Mavalane",
    active: true,
    createdAt: "2026-01-08T08:00:00",
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
    address: "Hospital Geral de Mavalane",
    active: true,
    createdAt: "2026-02-11T08:00:00",
  },
  {
    id: "USR-005",
    name: "Carla Nhaca",
    email: "carla@exemplo.mz",
    password: DEMO_PASSWORD,
    role: "ENCARREGADO",
    phone: "+258 82 771 4408",
    idDocument: "110100889123A",
    address: "Hulene B, Rua da Fonte nº 87",
    active: true,
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
    address: "Costa do Sol, Av. da Marginal nº 1204",
    active: true,
    createdAt: "2026-06-20T09:05:00",
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
];

type SeedConsultation = {
  id: string;
  reference: string;
  childId: string;
  /** Minutos relativos ao "agora" — negativo é passado. */
  createdOffset: number;
  scheduledOffset: number | null;
  symptoms: string[];
  otherSymptom?: string;
  notes?: string;
  channel: ConsultationChannel;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  source: ConsultationSource;
  doctorId?: string;
  clinicalNotes?: string;
  guidance?: string;
  referralReason?: string;
  attachments?: { name: string; kind: "IMAGEM" | "EXAME" | "DOCUMENTO" }[];
};

const seedConsultationTemplates: SeedConsultation[] = [
  {
    id: "TC-1042",
    reference: "R-1042",
    childId: "CRI-001",
    createdOffset: -12,
    scheduledOffset: null,
    symptoms: ["Febre alta", "Tosse"],
    notes: "Febre persistente 38.5°C, tosse seca, perda de apetite.",
    channel: "VIDEO",
    priority: "URGENTE",
    status: "PENDENTE",
    source: "USSD",
    attachments: [{ name: "termometro-38-5.jpg", kind: "IMAGEM" }],
  },
  {
    id: "TC-1041",
    reference: "R-1041",
    childId: "CRI-006",
    createdOffset: -38,
    scheduledOffset: -6,
    symptoms: ["Febre", "Diarreia"],
    notes: "Três dejecções líquidas desde ontem.",
    channel: "VIDEO",
    priority: "NORMAL",
    status: "EM_CURSO",
    source: "WEB",
    doctorId: "USR-002",
  },
  {
    id: "TC-1039",
    reference: "R-1039",
    childId: "CRI-003",
    createdOffset: -52,
    scheduledOffset: null,
    symptoms: ["Febre", "Dor de cabeça"],
    notes: "Sintomas começaram esta madrugada.",
    channel: "VOZ",
    priority: "NORMAL",
    status: "PENDENTE",
    source: "USSD",
  },
  {
    id: "TC-1036",
    reference: "R-1036",
    childId: "CRI-004",
    createdOffset: -96,
    scheduledOffset: 35,
    symptoms: ["Vómitos persistentes"],
    notes: "Sete episódios de vómito nas últimas 12 horas.",
    channel: "VIDEO",
    priority: "URGENTE",
    status: "AGENDADA",
    source: "USSD",
    doctorId: "USR-002",
  },
  {
    id: "TC-1034",
    reference: "R-1034",
    childId: "CRI-002",
    createdOffset: -145,
    scheduledOffset: 110,
    symptoms: ["Dor de garganta"],
    notes: "Dificuldade em engolir há dois dias.",
    channel: "VIDEO",
    priority: "NORMAL",
    status: "AGENDADA",
    source: "WEB",
    doctorId: "USR-004",
  },
  {
    id: "TC-1030",
    reference: "R-1030",
    childId: "CRI-005",
    createdOffset: -195,
    scheduledOffset: null,
    symptoms: ["Convulsões"],
    notes: "Convulsão de cerca de dois minutos.",
    channel: "VOZ",
    priority: "CRITICA",
    status: "ENCAMINHADA",
    source: "USSD",
    referralReason:
      "Sintoma crítico detectado na triagem automática — emergência pediátrica.",
  },
  {
    id: "TC-1026",
    reference: "R-1026",
    childId: "CRI-001",
    createdOffset: -1_530,
    scheduledOffset: -1_440,
    symptoms: ["Diarreia"],
    channel: "VOZ",
    priority: "NORMAL",
    status: "CONCLUIDA",
    source: "USSD",
    doctorId: "USR-002",
    clinicalNotes: "Quadro de gastroenterite ligeira, sem sinais de desidratação.",
    guidance: "Sais de reidratação oral de 4 em 4 horas. Reavaliar em 48 horas.",
  },
  {
    id: "TC-1021",
    reference: "R-1021",
    childId: "CRI-003",
    createdOffset: -2_940,
    scheduledOffset: -2_880,
    symptoms: ["Tosse", "Febre"],
    channel: "VIDEO",
    priority: "NORMAL",
    status: "CONCLUIDA",
    source: "WEB",
    doctorId: "USR-004",
    clinicalNotes: "Infecção respiratória alta de provável etiologia viral.",
    guidance: "Paracetamol em SOS, hidratação abundante e repouso.",
    attachments: [{ name: "raio-x-torax.pdf", kind: "EXAME" }],
  },
  {
    id: "TC-1018",
    reference: "R-1018",
    childId: "CRI-002",
    createdOffset: -4_350,
    scheduledOffset: -4_320,
    symptoms: ["Dor abdominal forte"],
    channel: "VIDEO",
    priority: "URGENTE",
    status: "ENCAMINHADA",
    source: "USSD",
    doctorId: "USR-002",
    clinicalNotes: "Dor localizada na fossa ilíaca direita, com defesa à palpação.",
    referralReason: "Suspeita de apendicite — encaminhada para o banco de urgência do HGM.",
  },
  {
    id: "TC-1014",
    reference: "R-1014",
    childId: "CRI-007",
    createdOffset: -5_800,
    scheduledOffset: -5_760,
    symptoms: [],
    otherSymptom: "Manchas na pele que não desaparecem",
    channel: "VOZ",
    priority: "AVALIACAO",
    status: "CONCLUIDA",
    source: "USSD",
    doctorId: "USR-004",
    clinicalNotes: "Dermatite de contacto após uso de sabão novo.",
    guidance: "Suspender o produto e aplicar creme emoliente duas vezes ao dia.",
  },
];

function offsetToIso(reference: Date, minutes: number) {
  return new Date(reference.getTime() + minutes * 60_000).toISOString();
}

function findChild(childId: string) {
  return seedChildren.find((child) => child.id === childId)!;
}

function findGuardian(guardianId: string) {
  return seedUsers.find((user) => user.id === guardianId)!;
}

/**
 * Materializa os pedidos de demonstração à volta de uma referência temporal.
 * Chamado com `SEED_ANCHOR` no arranque (determinístico para o SSR) e com a
 * hora real após a hidratação.
 */
export function buildSeedConsultations(reference: Date = SEED_ANCHOR): Consultation[] {
  return seedConsultationTemplates.map((template) => {
    const child = findChild(template.childId);
    const guardian = findGuardian(child.guardianId);
    const doctor = template.doctorId
      ? seedUsers.find((user) => user.id === template.doctorId)
      : undefined;

    const scheduledAt =
      template.scheduledOffset === null
        ? null
        : offsetToIso(reference, template.scheduledOffset);

    const usesVideo = template.channel === "VIDEO" && scheduledAt !== null;

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
      createdAt: offsetToIso(reference, template.createdOffset),
      scheduledAt,
      meetingLink: usesVideo ? `https://telemedicina.hgm.mz/sala/${template.reference}` : null,
      meetingLinkExpiresAt:
        usesVideo && scheduledAt
          ? new Date(new Date(scheduledAt).getTime() + 10 * 60_000).toISOString()
          : null,
      smsSentAt: usesVideo ? offsetToIso(reference, template.createdOffset + 4) : null,
      assignedDoctorId: doctor?.id ?? null,
      assignedDoctorName: doctor?.name ?? null,
      clinicalNotes: template.clinicalNotes ?? "",
      guidance: template.guidance ?? "",
      referralReason: template.referralReason ?? "",
      attachments: (template.attachments ?? []).map((attachment, index) => ({
        id: `${template.id}-ATT-${index + 1}`,
        name: attachment.name,
        kind: attachment.kind,
        addedAt: offsetToIso(reference, template.createdOffset + 1),
      })),
      messages:
        template.status === "EM_CURSO"
          ? [
              {
                id: `${template.id}-MSG-1`,
                authorName: doctor?.name ?? "Equipa HGM",
                authorRole: "PEDIATRA" as const,
                text: "Boa tarde. Já consigo ver e ouvir bem. A Elsa está a beber líquidos?",
                sentAt: offsetToIso(reference, -4),
              },
              {
                id: `${template.id}-MSG-2`,
                authorName: guardian.name,
                authorRole: "ENCARREGADO" as const,
                text: "Boa tarde, doutora. Está a beber pouco desde a manhã.",
                sentAt: offsetToIso(reference, -3),
              },
            ]
          : [],
      closedAt:
        template.status === "CONCLUIDA" || template.status === "ENCAMINHADA"
          ? offsetToIso(reference, (template.scheduledOffset ?? template.createdOffset) + 25)
          : null,
      seeded: true,
    } satisfies Consultation;
  });
}

/** Próximo número de referência disponível. */
export const SEED_REFERENCE_START = 1_045;

import type { Consultation } from "../types/consultation";
import {
  assignmentQueueStatuses,
  closedStatuses,
  schedulingQueueStatuses,
  triageQueueStatuses,
} from "../types/consultation";
import type { User, UserRole } from "../types/user";

/**
 * Controlo de acesso por perfil ao nível da rota.
 *
 * O protótipo anterior escondia os itens de menu que não pertenciam ao perfil,
 * mas o URL continuava acessível. Aqui a regra vive num só sítio e é aplicada
 * no layout protegido: quem não tem perfil para a rota recebe "Acesso não
 * autorizado" com regresso a /inicio.
 */
type RouteRule = { prefix: string; roles: UserRole[] };

const routeRules: RouteRule[] = [
  { prefix: "/administracao", roles: ["ADMINISTRATIVO"] },
  { prefix: "/triagem", roles: ["TRIAGEM"] },
  { prefix: "/disponibilidade", roles: ["PEDIATRA", "ADMINISTRATIVO"] },
  { prefix: "/criancas", roles: ["ENCARREGADO"] },
  { prefix: "/teleconsultas/novo", roles: ["ENCARREGADO"] },
  {
    prefix: "/teleconsultas",
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
  },
  {
    prefix: "/historico-clinico",
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
  },
  {
    prefix: "/notificacoes",
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
  },
  {
    prefix: "/inicio",
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
  },
  {
    prefix: "/perfil",
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
  },
];

/** A regra mais específica ganha (`/teleconsultas/novo` antes de `/teleconsultas`). */
export function canAccessRoute(role: UserRole, pathname: string) {
  const match = routeRules
    .filter(
      (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
    )
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!match) return true;
  return match.roles.includes(role);
}

// ---------------------------------------------------------------------------
// Visibilidade dos pedidos clínicos
// ---------------------------------------------------------------------------

/**
 * Como o utilizador vê um pedido concreto:
 *
 * - `COMPLETO`       — encarregado do próprio pedido ou pediatra responsável.
 * - `TRIAGEM`        — profissional de triagem: sintomas, observações e idade,
 *                      o necessário para classificar o pedido. Sem notas
 *                      clínicas nem prescrições, que pertencem ao pediatra.
 * - `ADMINISTRATIVO` — gestão e relatórios, sem conteúdo clínico detalhado.
 * - `RESTRITO`       — pediatra que não é o responsável pelo caso.
 */
export type AccessLevel = "COMPLETO" | "TRIAGEM" | "ADMINISTRATIVO" | "RESTRITO";

export function accessLevelFor(
  user: User,
  consultation: Consultation,
): AccessLevel {
  if (user.role === "ENCARREGADO") {
    return isOwnRequest(user, consultation) ? "COMPLETO" : "RESTRITO";
  }

  if (user.role === "ADMINISTRATIVO") return "ADMINISTRATIVO";
  if (user.role === "TRIAGEM") return "TRIAGEM";

  if (consultation.assignedDoctorId === user.id) return "COMPLETO";

  // Acesso excepcional já justificado e registado para auditoria.
  const granted = (consultation.accessLog ?? []).some(
    (entry) => entry.userId === user.id,
  );
  return granted ? "COMPLETO" : "RESTRITO";
}

export function isOwnRequest(user: User, consultation: Consultation) {
  return (
    consultation.guardianId === user.id ||
    (Boolean(consultation.phone) && consultation.phone === user.phone)
  );
}

/** Notas clínicas, orientação, anexos e chat da consulta. */
export function canSeeClinicalRecord(level: AccessLevel) {
  return level === "COMPLETO";
}

/** Telefone, nome do encarregado e morada. */
export function canSeeContactDetails(level: AccessLevel) {
  return level === "COMPLETO";
}

// ---------------------------------------------------------------------------
// Permissões por acção (§1, §2, §3 e §10 do relatório)
// ---------------------------------------------------------------------------

/** Só o profissional de triagem tria. O botão não existe para os restantes. */
export function canTriage(user: User, consultation: Consultation) {
  if (user.role !== "TRIAGEM") return false;
  return triageQueueStatuses.includes(consultation.status);
}

/** Rever a prioridade de um pedido já triado, com justificação obrigatória. */
export function canReviewPriority(user: User, consultation: Consultation) {
  return (
    user.role === "TRIAGEM" &&
    consultation.triagedAt !== null &&
    !closedStatuses.includes(consultation.status)
  );
}

/** Atribuir um pediatra: perfil administrativo, depois da triagem. */
export function canAssignDoctor(user: User, consultation: Consultation) {
  return (
    user.role === "ADMINISTRATIVO" &&
    assignmentQueueStatuses.includes(consultation.status)
  );
}

/** Reatribuir um pedido já atribuído mas ainda sem consulta realizada. */
export function canReassignDoctor(user: User, consultation: Consultation) {
  return (
    user.role === "ADMINISTRATIVO" &&
    (schedulingQueueStatuses.includes(consultation.status) ||
      consultation.status === "CONSULTA_AGENDADA")
  );
}

/** Confirmar que a triagem foi analisada ("Analisar pedido"). */
export function canReviewRequest(user: User, consultation: Consultation) {
  return (
    user.role === "PEDIATRA" &&
    consultation.assignedDoctorId === user.id &&
    consultation.status === "PEDIATRA_ATRIBUIDO"
  );
}

/** Definir o horário ("Definir horário"). */
export function canSchedule(user: User, consultation: Consultation) {
  return (
    user.role === "PEDIATRA" &&
    consultation.assignedDoctorId === user.id &&
    consultation.status === "AGUARDA_AGENDAMENTO"
  );
}

/** Actualizar um agendamento já existente. */
export function canReschedule(user: User, consultation: Consultation) {
  return (
    user.role === "PEDIATRA" &&
    consultation.assignedDoctorId === user.id &&
    consultation.status === "CONSULTA_AGENDADA"
  );
}

/** Realizar a consulta e encerrar o registo clínico. */
export function canConductConsultation(user: User, consultation: Consultation) {
  return (
    user.role === "PEDIATRA" &&
    consultation.assignedDoctorId === user.id &&
    (consultation.status === "CONSULTA_AGENDADA" ||
      consultation.status === "CONSULTA_EM_CURSO")
  );
}

/** Notas clínicas, orientação e encaminhamento: só o pediatra responsável. */
export function canWriteClinicalRecord(user: User, consultation: Consultation) {
  return user.role === "PEDIATRA" && consultation.assignedDoctorId === user.id;
}

/** Criar ou alterar a prescrição: exclusivo do pediatra responsável (§10). */
export function canWritePrescription(user: User, consultation: Consultation) {
  return (
    canWriteClinicalRecord(user, consultation) &&
    consultation.status !== "CANCELADO"
  );
}

/**
 * Ver a prescrição: o pediatra do caso e o encarregado responsável pela
 * respectiva criança. O perfil administrativo nunca.
 */
export function canSeePrescription(user: User, consultation: Consultation) {
  if (user.role === "ENCARREGADO") return isOwnRequest(user, consultation);
  if (user.role === "PEDIATRA") {
    return accessLevelFor(user, consultation) === "COMPLETO";
  }
  return false;
}

/** Cancelar o pedido: o encarregado, enquanto não houver consulta em curso. */
export function canCancelRequest(user: User, consultation: Consultation) {
  if (closedStatuses.includes(consultation.status)) return false;
  if (consultation.status === "CONSULTA_EM_CURSO") return false;
  if (user.role === "ENCARREGADO") return isOwnRequest(user, consultation);
  return user.role === "ADMINISTRATIVO";
}

/** Entrar na sala: quem participa na consulta. */
export function canJoinRoom(user: User, consultation: Consultation) {
  if (consultation.status !== "CONSULTA_EM_CURSO" &&
      consultation.status !== "CONSULTA_AGENDADA") {
    return false;
  }
  if (user.role === "ENCARREGADO") return isOwnRequest(user, consultation);
  return user.role === "PEDIATRA" && consultation.assignedDoctorId === user.id;
}

/**
 * Pedidos que um utilizador pode ver listados.
 *
 * O encarregado vê os seus. O profissional de triagem vê a fila de triagem e o
 * que já triou. O pediatra vê os pedidos que lhe foram atribuídos; os casos de
 * colegas continuam listados — a coordenação do serviço precisa disso — mas com
 * os dados pessoais reduzidos. A administração vê tudo, sem conteúdo clínico.
 */
export function visibleConsultations(user: User, data: Consultation[]) {
  if (user.role === "ENCARREGADO") {
    return data.filter((item) => isOwnRequest(user, item));
  }
  return data;
}

export function isAssignedTo(consultation: Consultation, userId: string) {
  return consultation.assignedDoctorId === userId;
}

/** Pedidos à espera de triagem. */
export function isInTriageQueue(consultation: Consultation) {
  return triageQueueStatuses.includes(consultation.status);
}

/** Pedidos triados à espera de atribuição. */
export function isInAssignmentQueue(consultation: Consultation) {
  return assignmentQueueStatuses.includes(consultation.status);
}

/** Pedidos atribuídos à espera de horário. */
export function isInSchedulingQueue(consultation: Consultation) {
  return schedulingQueueStatuses.includes(consultation.status);
}

/**
 * Versão do pedido segura para o nível de acesso: substitui identificação e
 * contactos por um identificador não nominativo quando não há necessidade
 * clínica de os ver.
 */
export function maskConsultation(
  consultation: Consultation,
  level: AccessLevel,
): Consultation {
  if (level === "COMPLETO") return consultation;

  const initials = toInitials(consultation.childName);
  const reference = `${initials} · ${consultation.reference}`;

  if (level === "ADMINISTRATIVO") {
    // A administração identifica o pedido para efeitos de gestão — referência,
    // idade, sintomas, prioridade, data/hora, triagem, pediatra, estado, canal
    // e observações (§7) — mas não vê o conteúdo clínico.
    return {
      ...consultation,
      childName: reference,
      phone: maskPhone(consultation.phone),
      clinicalNotes: "",
      guidance: "",
      prescriptions: [],
      attachments: [],
      messages: [],
    };
  }

  if (level === "TRIAGEM") {
    // A triagem precisa dos sintomas, das observações do encarregado e da
    // idade. O processo clínico do pediatra fica fora.
    return {
      ...consultation,
      childName: reference,
      guardianName: "Identificação reservada",
      phone: maskPhone(consultation.phone),
      clinicalNotes: "",
      guidance: "",
      prescriptions: [],
      attachments: [],
      messages: [],
    };
  }

  return {
    ...consultation,
    childName: reference,
    guardianName: "Identificação reservada",
    phone: maskPhone(consultation.phone),
    notes: consultation.notes,
    clinicalNotes: "",
    guidance: "",
    prescriptions: [],
    attachments: [],
    messages: [],
  };
}

/** "Tiago Mondlane" → "T. M." */
export function toInitials(name: string) {
  const parts = name
    .replace(/^(Dr|Dra)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "—";
  return parts.map((part) => `${part[0].toUpperCase()}.`).join(" ");
}

/** "+258 84 512 3390" → "+258 84 *** 3390" */
export function maskPhone(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.length < 6) return "***";

  const tail = trimmed.slice(-4);
  const head = trimmed.slice(0, Math.max(trimmed.length - 8, 0)).trimEnd();
  return `${head || "+258"} *** ${tail}`.replace(/\s+/g, " ");
}

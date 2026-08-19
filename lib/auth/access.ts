import type { Consultation } from "../types/consultation";
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
  { prefix: "/administracao", roles: ["ADMIN"] },
  { prefix: "/criancas", roles: ["ENCARREGADO"] },
  { prefix: "/teleconsultas/novo", roles: ["ENCARREGADO"] },
  { prefix: "/teleconsultas", roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"] },
  { prefix: "/historico-clinico", roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"] },
  { prefix: "/inicio", roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"] },
  { prefix: "/perfil", roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"] },
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
 * - `COMPLETO`   — encarregado do próprio pedido ou pediatra responsável.
 * - `TRIAGEM`    — pedido ainda sem pediatra atribuído: qualquer pediatra vê o
 *                  essencial para o avaliar e assumir, sem contactos.
 * - `ADMINISTRATIVO` — administração: gestão e relatórios, sem conteúdo clínico
 *                  detalhado.
 * - `RESTRITO`   — pediatra que não é o responsável pelo caso.
 */
export type AccessLevel = "COMPLETO" | "TRIAGEM" | "ADMINISTRATIVO" | "RESTRITO";

export function accessLevelFor(
  user: User,
  consultation: Consultation,
): AccessLevel {
  if (user.role === "ENCARREGADO") {
    return isOwnRequest(user, consultation) ? "COMPLETO" : "RESTRITO";
  }

  if (user.role === "ADMIN") return "ADMINISTRATIVO";

  if (consultation.assignedDoctorId === user.id) return "COMPLETO";
  if (!consultation.assignedDoctorId) return "TRIAGEM";

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

/** Agendar, iniciar, encerrar ou encaminhar a teleconsulta. */
export function canActOnConsultation(user: User, level: AccessLevel) {
  return user.role === "PEDIATRA" && (level === "COMPLETO" || level === "TRIAGEM");
}

/**
 * Pedidos que um utilizador pode ver listados.
 *
 * O pediatra vê a fila geral de triagem (ainda por atribuir) e as suas
 * teleconsultas. Os casos de colegas continuam listados — a coordenação do
 * serviço precisa disso — mas com os dados pessoais reduzidos.
 */
export function visibleConsultations(user: User, data: Consultation[]) {
  if (user.role === "ENCARREGADO") {
    return data.filter((item) => isOwnRequest(user, item));
  }
  return data;
}

/** Pedidos da fila de triagem: sem pediatra atribuído. */
export function isInTriageQueue(consultation: Consultation) {
  return !consultation.assignedDoctorId;
}

export function isAssignedTo(consultation: Consultation, userId: string) {
  return consultation.assignedDoctorId === userId;
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

  if (level === "ADMINISTRATIVO") {
    // A administração identifica o pedido e a família para efeitos de gestão,
    // mas não vê o conteúdo clínico detalhado. Os contactos completos estão na
    // área de utilizadores, onde têm uma finalidade administrativa clara.
    return {
      ...consultation,
      phone: maskPhone(consultation.phone),
      clinicalNotes: "",
      guidance: "",
      attachments: [],
      messages: [],
    };
  }

  return {
    ...consultation,
    childName: `${initials} · ${consultation.reference}`,
    guardianName: "Identificação reservada",
    phone: maskPhone(consultation.phone),
    location: consultation.location,
    notes: level === "TRIAGEM" ? consultation.notes : "",
    clinicalNotes: "",
    guidance: "",
    referralReason: level === "TRIAGEM" ? consultation.referralReason : "",
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

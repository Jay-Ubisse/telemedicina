export type UserRole = "ENCARREGADO" | "PEDIATRA" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  /** Demo-only. Credentials live in localStorage; never do this in production. */
  password: string;
  role: UserRole;
  phone: string;
  /** Documento de identificação (BI / DIRE / Passaporte). */
  idDocument?: string;
  /** Bairro / avenida — a plataforma opera na cidade de Maputo. */
  address?: string;
  specialty?: string;
  /** Número da Ordem dos Médicos. */
  licenseNumber?: string;
  active: boolean;
  createdAt: string;
};

export type Child = {
  id: string;
  guardianId: string;
  name: string;
  /** ISO date (YYYY-MM-DD). */
  birthDate: string;
  sex: "M" | "F";
  /** Alergias, condições crónicas, medicação habitual. */
  notes?: string;
  createdAt: string;
};

export const roleLabels: Record<UserRole, string> = {
  ENCARREGADO: "Encarregado de educação",
  PEDIATRA: "Pediatra",
  ADMIN: "Administrador",
};

export const shortRoleLabels: Record<UserRole, string> = {
  ENCARREGADO: "Encarregado",
  PEDIATRA: "Pediatra",
  ADMIN: "Administrador",
};

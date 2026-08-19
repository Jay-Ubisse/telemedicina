export type UserRole = "ENCARREGADO" | "PEDIATRA" | "ADMIN";

/** Turnos de escala do serviço de pediatria do HGM. */
export type Shift = "MANHA" | "TARDE" | "NOITE";

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
  /** Bairro da cidade de Maputo — a plataforma opera só nesta cidade. */
  address?: string;
  specialty?: string;
  /** Número da Ordem dos Médicos. */
  licenseNumber?: string;
  /** Turno de escala (apenas pediatras). */
  shift?: Shift;
  /** Disponibilidade actual para assumir novos pedidos (apenas pediatras). */
  available?: boolean;
  active: boolean;
  createdAt: string;
  /**
   * Conta criada automaticamente a partir de um pedido USSD de um número
   * ainda não registado. Serve para ligar a criança a um encarregado, mas
   * ainda não tem palavra-passe definida.
   */
  provisional?: boolean;
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
  /**
   * Crianças com histórico clínico nunca são apagadas — são arquivadas,
   * preservando os pedidos e as notas clínicas associadas.
   */
  archived?: boolean;
  archivedAt?: string;
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

export const shiftLabels: Record<Shift, string> = {
  MANHA: "Manhã (07h–13h)",
  TARDE: "Tarde (13h–19h)",
  NOITE: "Noite (19h–07h)",
};

export const shortShiftLabels: Record<Shift, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

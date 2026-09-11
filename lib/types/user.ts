/**
 * Perfis da plataforma (ver `docs/relatorio.docx`, §1).
 *
 * São quatro ambientes demonstrativos com permissões distintas:
 *
 * - `ENCARREGADO` regista a criança, submete o pedido, acompanha o estado e
 *   consulta as orientações e a prescrição da sua criança.
 * - `TRIAGEM` analisa os sintomas submetidos, atribui a prioridade, regista
 *   observações, justifica alterações e conclui a triagem. É o único perfil que
 *   tria — a plataforma não classifica pedidos automaticamente.
 * - `ADMINISTRATIVO` organiza os pedidos já triados, consulta a
 *   disponibilidade dos pediatras e atribui o pedido. Não tria nem toca em
 *   notas clínicas ou prescrições.
 * - `PEDIATRA` recebe os pedidos atribuídos, consulta a triagem, define o
 *   horário, realiza a teleconsulta e regista notas, orientação, encaminhamento
 *   e prescrição.
 */
export type UserRole = "ENCARREGADO" | "TRIAGEM" | "ADMINISTRATIVO" | "PEDIATRA";

/** Turnos de escala do serviço de pediatria do HGM. */
export type Shift = "MANHA" | "TARDE" | "NOITE";

/**
 * Estado de uma conta. Só `ACTIVA` pode iniciar sessão: contas inactivas,
 * bloqueadas ou provisórias ficam fora da plataforma (§12 do relatório).
 */
export type AccountState = "ACTIVA" | "INACTIVA" | "BLOQUEADA" | "PROVISORIA";

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
  /** Bairro da cidade de Maputo, ou um bairro indicado manualmente. */
  address?: string;
  specialty?: string;
  /** Número da Ordem dos Médicos. */
  licenseNumber?: string;
  /** Turno de escala registado (apenas pediatras). */
  shift?: Shift;
  /**
   * Disponibilidade declarada pelo próprio pediatra para o turno em curso.
   * Não basta para o considerar disponível: o turno tem de cobrir o momento,
   * ou existir uma disponibilidade adicional registada (§14 do relatório).
   */
  available?: boolean;
  /**
   * Estado da conta. Substitui o antigo par `active` + `provisional`, que
   * permitia combinações contraditórias — foi por aí que o protótipo testado
   * deixou entrar uma conta marcada como inactiva.
   */
  state: AccountState;
  createdAt: string;
  /**
   * Conta criada automaticamente a partir de um pedido USSD de um número ainda
   * não registado (`state === "PROVISORIA"`). Serve para ligar a criança a um
   * encarregado; só passa a ter acesso depois de activada — pela própria
   * família em «Criar conta» ou pela administração, em «Activar conta».
   */
  activatedAt?: string;
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
  TRIAGEM: "Profissional de triagem",
  ADMINISTRATIVO: "Administrativo",
  PEDIATRA: "Pediatra",
};

export const shortRoleLabels: Record<UserRole, string> = {
  ENCARREGADO: "Encarregado",
  TRIAGEM: "Triagem",
  ADMINISTRATIVO: "Administrativo",
  PEDIATRA: "Pediatra",
};

/** Responsabilidade de cada perfil, tal como descrita no relatório. */
export const roleResponsibilities: Record<UserRole, string> = {
  ENCARREGADO:
    "Regista a criança, submete o pedido, acompanha o estado, recebe as informações do agendamento, entra na consulta e consulta as orientações disponibilizadas.",
  TRIAGEM:
    "Recebe o pedido, analisa os sintomas, confirma ou altera a prioridade, justifica alterações, regista observações e encaminha o pedido.",
  ADMINISTRATIVO:
    "Organiza pedidos, consulta a disponibilidade, atribui o pedido a um pediatra e acompanha o estado. Não realiza triagem nem altera notas clínicas ou prescrições.",
  PEDIATRA:
    "Recebe os pedidos atribuídos, consulta a triagem, define ou confirma o horário, realiza a teleconsulta e regista notas, orientações, encaminhamento e prescrição.",
};

export const shiftLabels: Record<Shift, string> = {
  MANHA: "Manhã (07h00–13h00)",
  TARDE: "Tarde (13h00–19h00)",
  NOITE: "Noite (19h00–07h00)",
};

export const shortShiftLabels: Record<Shift, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

/** Janela horária de cada turno, em minutos desde a meia-noite. */
export const shiftRanges: Record<Shift, { start: number; end: number }> = {
  MANHA: { start: 7 * 60, end: 13 * 60 },
  TARDE: { start: 13 * 60, end: 19 * 60 },
  // Atravessa a meia-noite: tratado explicitamente em `lib/utils/availability`.
  NOITE: { start: 19 * 60, end: 7 * 60 },
};

export const accountStateLabels: Record<AccountState, string> = {
  ACTIVA: "Activa",
  INACTIVA: "Inactiva",
  BLOQUEADA: "Bloqueada",
  PROVISORIA: "Provisória (pedido USSD)",
};

/** Só uma conta activa inicia sessão. */
export function canSignIn(user: User) {
  return user.state === "ACTIVA" && user.password.length > 0;
}

export function isProvisional(user: User) {
  return user.state === "PROVISORIA";
}

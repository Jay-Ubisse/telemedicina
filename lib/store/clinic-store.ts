"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEMO_PASSWORD,
  SEED_ANCHOR,
  SEED_REFERENCE_START,
  buildSeedAvailability,
  buildSeedConsultations,
  buildSeedNotifications,
  seedChildren,
  seedUsers,
} from "../data/seed";
import { notificationMessages } from "../data/notification-messages";
import { normalizeNeighbourhood } from "../data/locations";
import type {
  AccessLogEntry,
  AccessReason,
  Attachment,
  AttachmentKind,
  ChatMessage,
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
  ConsultationStatus,
  Prescription,
  PrescriptionRoute,
  PriorityChange,
  ScheduleChange,
  TimelineEntry,
  TriageOutcome,
} from "../types/consultation";
import {
  assignmentQueueStatuses,
  closedStatuses,
  openStatuses,
  priorityLabels,
  schedulingQueueStatuses,
  statusLabels,
  triageQueueStatuses,
} from "../types/consultation";
import type {
  Availability,
  AvailabilityKind,
  AvailabilityState,
} from "../types/availability";
import type { AppNotification, NotificationKind } from "../types/notification";
import type { Child, Shift, User, UserRole } from "../types/user";
import { canSignIn } from "../types/user";
import { validateAvailabilityWindow } from "../utils/availability";
import { ageInYears } from "../utils/date";
import { validateChildAge } from "../utils/intake";

/** O acesso à sala expira 10 minutos depois da hora marcada. */
export const MEETING_LINK_GRACE_MINUTES = 10;

/** Duração prevista por omissão de uma teleconsulta, em minutos. */
export const DEFAULT_DURATION_MINUTES = 20;

/**
 * Uma consulta marcada para dentro desta janela conta como «a aproximar-se» e
 * gera o aviso correspondente ao pediatra (§9 do relatório).
 */
export const UPCOMING_WINDOW_MINUTES = 60;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  idDocument: string;
  address: string;
  child?: {
    name: string;
    birthDate: string;
    sex: "M" | "F";
    notes?: string;
  };
};

export type CreateConsultationInput = {
  childId: string;
  guardianId: string | null;
  /** Só usado quando o pedido chega por USSD sem conta associada. */
  fallbackChildName?: string;
  fallbackChildAge?: number;
  fallbackGuardianName?: string;
  phone: string;
  location: string;
  symptoms: string[];
  otherSymptom?: string;
  notes?: string;
  channel: ConsultationChannel;
  source: "USSD" | "WEB";
  /** Pediatra de preferência indicado pelo encarregado (§7). */
  preferredDoctorId?: string | null;
  /** Consentimento do encarregado para a teleconsulta (§4). */
  consent: boolean;
};

export type TriageInput = {
  professionalId: string;
  priority: ConsultationPriority;
  observations: string;
  outcome: TriageOutcome;
  /** Obrigatória quando a prioridade difere de uma já atribuída. */
  justification?: string;
  /** Motivo do encaminhamento, quando o destino é o atendimento presencial. */
  referralReason?: string;
};

export type PriorityReviewInput = {
  professionalId: string;
  priority: ConsultationPriority;
  justification: string;
};

export type AssignInput = {
  doctorId: string;
  assignedById: string;
  note?: string;
};

export type HoldAssignmentInput = {
  assignedById: string;
  note: string;
};

export type ScheduleInput = {
  scheduledAt: string;
  durationMinutes: number;
  channel: ConsultationChannel;
  notes?: string;
  byId: string;
};

export type RescheduleInput = {
  scheduledAt: string;
  durationMinutes: number;
  channel?: ConsultationChannel;
  reason: string;
  byId: string;
};

export type CompleteInput = {
  clinicalNotes: string;
  guidance: string;
  byId: string;
};

export type PrescriptionInput = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: PrescriptionRoute;
  recommendations?: string;
};

export type AttachmentInput = {
  name: string;
  kind: AttachmentKind;
  mimeType?: string;
  size?: number;
  dataUrl?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  specialty?: string;
  licenseNumber?: string;
  shift?: Shift;
  available?: boolean;
  address?: string;
  idDocument?: string;
};

export type AvailabilityInput = {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  modality: ConsultationChannel;
  kind: AvailabilityKind;
  state?: AvailabilityState;
  notes?: string;
};

type ClinicState = {
  users: User[];
  children: Child[];
  consultations: Consultation[];
  availability: Availability[];
  notifications: AppNotification[];
  sessionUserId: string | null;
  nextReference: number;
  demoDaySyncedAt: string | null;

  // --- autenticação -------------------------------------------------------
  login: (email: string, password: string) => ActionResult<User>;
  logout: () => void;
  register: (input: RegisterInput) => ActionResult<User>;
  updateProfile: (userId: string, patch: Partial<User>) => ActionResult<User>;

  // --- crianças -----------------------------------------------------------
  addChild: (
    guardianId: string,
    input: Omit<Child, "id" | "guardianId" | "createdAt">,
  ) => ActionResult<Child>;
  updateChild: (childId: string, patch: Partial<Child>) => ActionResult<Child>;
  removeChild: (childId: string) => ActionResult<undefined>;
  archiveChild: (childId: string) => ActionResult<Child>;
  restoreChild: (childId: string) => ActionResult<Child>;

  // --- pedidos ------------------------------------------------------------
  createConsultation: (
    input: CreateConsultationInput,
  ) => ActionResult<{ consultation: Consultation; message: string }>;

  // triagem
  concludeTriage: (id: string, input: TriageInput) => ActionResult<Consultation>;
  reviewPriority: (
    id: string,
    input: PriorityReviewInput,
  ) => ActionResult<Consultation>;

  // atribuição
  assignDoctor: (id: string, input: AssignInput) => ActionResult<Consultation>;
  holdAssignment: (
    id: string,
    input: HoldAssignmentInput,
  ) => ActionResult<Consultation>;

  // pediatra
  reviewRequest: (id: string, doctorId: string) => ActionResult<Consultation>;
  scheduleConsultation: (
    id: string,
    input: ScheduleInput,
  ) => ActionResult<Consultation>;
  updateSchedule: (
    id: string,
    input: RescheduleInput,
  ) => ActionResult<Consultation>;
  startConsultation: (id: string, doctorId: string) => ActionResult<Consultation>;
  completeConsultation: (
    id: string,
    payload: CompleteInput,
  ) => ActionResult<Consultation>;
  referConsultation: (
    id: string,
    reason: string,
    byId: string,
  ) => ActionResult<Consultation>;
  cancelConsultation: (
    id: string,
    reason: string,
    byId: string,
  ) => ActionResult<Consultation>;
  requestScheduleChange: (
    id: string,
    reason: string,
    byId: string,
  ) => ActionResult<Consultation>;
  resendRoomAccess: (id: string, byId: string) => ActionResult<Consultation>;

  // prescrição
  addPrescription: (
    id: string,
    doctorId: string,
    input: PrescriptionInput,
  ) => ActionResult<Consultation>;
  updatePrescription: (
    id: string,
    prescriptionId: string,
    doctorId: string,
    input: PrescriptionInput,
  ) => ActionResult<Consultation>;
  removePrescription: (
    id: string,
    prescriptionId: string,
    doctorId: string,
  ) => ActionResult<Consultation>;

  sendMessage: (
    id: string,
    message: Omit<ChatMessage, "id" | "sentAt">,
  ) => ActionResult<Consultation>;
  addAttachment: (
    id: string,
    attachment: AttachmentInput,
  ) => ActionResult<Consultation>;
  /** Regista um acesso excepcional ao processo clínico (auditoria). */
  grantExceptionalAccess: (
    id: string,
    entry: { userId: string; userName: string; reason: AccessReason; note?: string },
  ) => ActionResult<Consultation>;

  // --- disponibilidade ----------------------------------------------------
  addAvailability: (input: AvailabilityInput) => ActionResult<Availability>;
  updateAvailability: (
    id: string,
    patch: Partial<AvailabilityInput>,
  ) => ActionResult<Availability>;
  cancelAvailability: (id: string) => ActionResult<Availability>;
  removeAvailability: (id: string) => ActionResult<undefined>;

  // --- notificações -------------------------------------------------------
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  clearNotifications: (userId: string) => void;

  // --- administração ------------------------------------------------------
  createUser: (input: CreateUserInput) => ActionResult<User>;
  updateUser: (userId: string, patch: Partial<User>) => ActionResult<User>;
  setUserState: (userId: string, state: User["state"]) => ActionResult<User>;
  /** Converte uma conta provisória do USSD numa conta definitiva (§11). */
  activateProvisionalAccount: (
    userId: string,
    input: { email: string; password: string; name?: string; idDocument?: string },
  ) => ActionResult<User>;
  removeUser: (userId: string) => ActionResult<undefined>;

  // --- demonstração -------------------------------------------------------
  syncDemoDay: () => void;
  resetDemo: () => void;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

function buildMeetingLink(reference: string) {
  return `https://telemedicina.hgm.mz/sala/${reference}`;
}

/** Compara números de telemóvel ignorando espaços e indicativo. */
function samePhone(a: string, b: string) {
  const digits = (value: string) => value.replace(/\D/g, "").slice(-9);
  return digits(a) !== "" && digits(a) === digits(b);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initialState() {
  const consultations = buildSeedConsultations(SEED_ANCHOR);

  return {
    users: seedUsers,
    children: seedChildren,
    consultations,
    availability: buildSeedAvailability(SEED_ANCHOR),
    notifications: buildSeedNotifications(consultations, seedUsers),
    sessionUserId: null,
    nextReference: SEED_REFERENCE_START,
    demoDaySyncedAt: null,
  };
}

export const useClinicStore = create<ClinicState>()(
  persist(
    (set, get) => {
      // ---------------------------------------------------------------------
      // Auxiliares internos
      // ---------------------------------------------------------------------

      /** Notificação interna. Nunca representa um envio externo real (§9). */
      function notify(
        recipients: (User | undefined | null)[],
        draft: { kind: NotificationKind; title: string; body: string },
        consultation: Consultation | null,
      ) {
        const now = new Date().toISOString();
        const entries: AppNotification[] = [];

        for (const recipient of recipients) {
          if (!recipient) continue;
          if (recipient.state === "INACTIVA" || recipient.state === "BLOQUEADA") {
            continue;
          }

          entries.push({
            id: makeId("NOT"),
            userId: recipient.id,
            role: recipient.role,
            kind: draft.kind,
            title: draft.title,
            body: draft.body,
            createdAt: now,
            readAt: null,
            consultationId: consultation?.id ?? null,
            reference: consultation?.reference ?? null,
          });
        }

        if (entries.length === 0) return;

        set((state) => ({
          notifications: [...entries, ...state.notifications],
        }));
      }

      function usersByRole(role: UserRole) {
        return get().users.filter(
          (user) => user.role === role && user.state === "ACTIVA",
        );
      }

      function userById(id: string | null | undefined) {
        if (!id) return undefined;
        return get().users.find((user) => user.id === id);
      }

      function timelineEntry(
        status: ConsultationStatus,
        detail: string,
        actor: User | null,
      ): TimelineEntry {
        return {
          id: makeId("TL"),
          status,
          detail: detail || statusLabels[status],
          at: new Date().toISOString(),
          actorId: actor?.id ?? null,
          actorName: actor?.name ?? "Plataforma",
          actorRole: actor?.role ?? "SISTEMA",
        };
      }

      /** Aplica a alteração e devolve o pedido actualizado. */
      function commit(
        id: string,
        patch: Partial<Consultation>,
        entries: TimelineEntry[] = [],
      ): Consultation {
        const current = get().consultations.find((item) => item.id === id)!;
        const updated: Consultation = {
          ...current,
          ...patch,
          timeline: [...current.timeline, ...entries],
        };

        set((state) => ({
          consultations: state.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return updated;
      }

      return {
        ...initialState(),

        // --- autenticação -------------------------------------------------
        login: (email, password) => {
          const user = get().users.find(
            (item) => normalizeEmail(item.email) === normalizeEmail(email),
          );

          if (!user) {
            return fail(
              "Não existe nenhuma conta com este email. Verifique o endereço ou crie uma conta.",
            );
          }

          // O estado da conta é verificado antes da palavra-passe: uma conta
          // inactiva, bloqueada ou provisória não entra em circunstância
          // alguma. Era esta a falha registada no §12 do relatório.
          if (user.state === "INACTIVA") {
            return fail(
              "Esta conta está inactiva e não tem acesso à plataforma. Contacte a administração do HGM para a reactivar.",
            );
          }
          if (user.state === "BLOQUEADA") {
            return fail(
              "Esta conta está bloqueada. Contacte a administração do HGM.",
            );
          }
          if (user.state === "PROVISORIA") {
            return fail(
              "Esta conta foi criada a partir de um pedido USSD e ainda é provisória. Conclua o registo em «Criar conta» com o mesmo número de telemóvel, ou peça à administração do HGM para a activar.",
            );
          }
          if (!user.password) {
            return fail(
              "Esta conta ainda não tem palavra-passe definida. Contacte a administração do HGM.",
            );
          }
          if (user.password !== password) return fail("Palavra-passe incorrecta.");
          if (!canSignIn(user)) {
            return fail("Esta conta não tem acesso à plataforma.");
          }

          set({ sessionUserId: user.id });
          return { ok: true, data: user };
        },

        logout: () => set({ sessionUserId: null }),

        register: (input) => {
          const email = normalizeEmail(input.email);

          if (!input.name.trim()) return fail("Indique o nome completo.");
          if (!isEmail(email)) return fail("Indique um email válido.");
          if (input.password.length < 6) {
            return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
          }
          if (!input.phone.trim()) return fail("Indique o número de telefone.");
          if (!input.address.trim()) return fail("Indique o bairro de residência.");
          if (get().users.some((user) => normalizeEmail(user.email) === email)) {
            return fail("Já existe uma conta registada com este email.");
          }

          const now = new Date().toISOString();
          const address = normalizeNeighbourhood(input.address);

          // Um pedido USSD feito a partir de um número ainda não registado cria
          // uma conta provisória. Quando essa família se regista na web com o
          // mesmo número, a conta é activada — em vez de duplicada — e as
          // crianças e os pedidos já existentes passam a ser visíveis.
          const provisional = get().users.find(
            (item) =>
              item.state === "PROVISORIA" && samePhone(item.phone, input.phone),
          );

          if (provisional) {
            const claimed: User = {
              ...provisional,
              name: input.name.trim(),
              email,
              password: input.password,
              phone: input.phone.trim(),
              idDocument: input.idDocument.trim(),
              address,
              state: "ACTIVA",
              activatedAt: now,
            };

            // Evita duplicar a criança que já tinha sido criada pelo USSD.
            const alreadyRegistered = get().children.some(
              (child) =>
                child.guardianId === claimed.id &&
                child.name.trim().toLowerCase() ===
                  (input.child?.name.trim().toLowerCase() ?? ""),
            );

            const extraChild: Child | null =
              input.child && !alreadyRegistered
                ? {
                    id: makeId("CRI"),
                    guardianId: claimed.id,
                    name: input.child.name.trim(),
                    birthDate: input.child.birthDate,
                    sex: input.child.sex,
                    notes: input.child.notes?.trim() ?? "",
                    createdAt: now,
                  }
                : null;

            set((state) => ({
              users: state.users.map((item) =>
                item.id === claimed.id ? claimed : item,
              ),
              children: extraChild
                ? [...state.children, extraChild]
                : state.children,
              // Os pedidos USSD permanecem associados a este encarregado.
              consultations: state.consultations.map((item) =>
                item.guardianId === claimed.id
                  ? { ...item, guardianName: claimed.name }
                  : item,
              ),
              sessionUserId: claimed.id,
            }));

            return { ok: true, data: claimed };
          }

          const user: User = {
            id: makeId("USR"),
            name: input.name.trim(),
            email,
            password: input.password,
            role: "ENCARREGADO",
            phone: input.phone.trim(),
            idDocument: input.idDocument.trim(),
            address,
            state: "ACTIVA",
            createdAt: now,
          };

          const child: Child | null = input.child
            ? {
                id: makeId("CRI"),
                guardianId: user.id,
                name: input.child.name.trim(),
                birthDate: input.child.birthDate,
                sex: input.child.sex,
                notes: input.child.notes?.trim() ?? "",
                createdAt: now,
              }
            : null;

          set((state) => ({
            users: [...state.users, user],
            children: child ? [...state.children, child] : state.children,
            sessionUserId: user.id,
          }));

          return { ok: true, data: user };
        },

        updateProfile: (userId, patch) => {
          const user = get().users.find((item) => item.id === userId);
          if (!user) return fail("Utilizador não encontrado.");

          if (patch.name !== undefined && patch.name.trim().length < 3) {
            return fail("Indique o nome completo.");
          }

          if (patch.email) {
            const email = normalizeEmail(patch.email);
            if (!isEmail(email)) return fail("Indique um email válido.");
            const taken = get().users.some(
              (item) => item.id !== userId && normalizeEmail(item.email) === email,
            );
            if (taken) return fail("Esse email já está associado a outra conta.");
          }

          if (patch.password !== undefined && patch.password.length < 6) {
            return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
          }

          if (
            patch.phone !== undefined &&
            patch.phone.replace(/\D/g, "").length < 9
          ) {
            return fail("Indique um número de telefone válido (9 dígitos).");
          }

          const updated: User = {
            ...user,
            ...patch,
            address:
              patch.address !== undefined
                ? normalizeNeighbourhood(patch.address)
                : user.address,
            id: user.id,
          };

          set((state) => ({
            users: state.users.map((item) =>
              item.id === userId ? updated : item,
            ),
            // O nome do pediatra aparece em pedidos e disponibilidades.
            availability: state.availability.map((item) =>
              item.doctorId === userId
                ? { ...item, doctorName: updated.name }
                : item,
            ),
            consultations: state.consultations.map((item) => ({
              ...item,
              guardianName:
                item.guardianId === userId ? updated.name : item.guardianName,
              assignedDoctorName:
                item.assignedDoctorId === userId
                  ? updated.name
                  : item.assignedDoctorName,
              triageProfessionalName:
                item.triageProfessionalId === userId
                  ? updated.name
                  : item.triageProfessionalName,
            })),
          }));

          return { ok: true, data: updated };
        },

        // --- crianças -----------------------------------------------------
        addChild: (guardianId, input) => {
          if (!input.name.trim()) return fail("Indique o nome da criança.");
          if (!input.birthDate) return fail("Indique a data de nascimento.");

          const age = ageInYears(input.birthDate);
          const validation = validateChildAge(age);
          if (!validation.valid) return fail(validation.error!);

          const duplicate = get().children.some(
            (child) =>
              child.guardianId === guardianId &&
              child.name.trim().toLowerCase() === input.name.trim().toLowerCase() &&
              child.birthDate === input.birthDate,
          );
          if (duplicate) return fail("Esta criança já está registada na sua conta.");

          const child: Child = {
            id: makeId("CRI"),
            guardianId,
            name: input.name.trim(),
            birthDate: input.birthDate,
            sex: input.sex,
            notes: input.notes?.trim() ?? "",
            createdAt: new Date().toISOString(),
          };

          set((state) => ({ children: [...state.children, child] }));
          return { ok: true, data: child };
        },

        updateChild: (childId, patch) => {
          const child = get().children.find((item) => item.id === childId);
          if (!child) return fail("Criança não encontrada.");

          if (patch.birthDate) {
            const validation = validateChildAge(ageInYears(patch.birthDate));
            if (!validation.valid) return fail(validation.error!);
          }

          const updated: Child = { ...child, ...patch, id: child.id };

          set((state) => ({
            children: state.children.map((item) =>
              item.id === childId ? updated : item,
            ),
            // Mantém o nome já visível nos pedidos em curso coerente.
            consultations: state.consultations.map((item) =>
              item.childId === childId ? { ...item, childName: updated.name } : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        /**
         * Eliminação definitiva só quando não existe qualquer pedido ou registo
         * clínico associado. Havendo histórico, a criança é arquivada — nunca
         * apagada — para preservar a informação clínica.
         */
        removeChild: (childId) => {
          const history = get().consultations.filter(
            (item) => item.childId === childId,
          );

          if (history.length > 0) {
            const open = history.some((item) => openStatuses.includes(item.status));
            return fail(
              open
                ? "Não é possível eliminar: existe um pedido em aberto para esta criança. Aguarde o encerramento ou arquive o registo."
                : `Não é possível eliminar: existem ${history.length} pedido(s) no histórico clínico desta criança. Utilize «Arquivar» para preservar a informação.`,
            );
          }

          set((state) => ({
            children: state.children.filter((item) => item.id !== childId),
          }));

          return { ok: true, data: undefined };
        },

        archiveChild: (childId) => {
          const child = get().children.find((item) => item.id === childId);
          if (!child) return fail("Criança não encontrada.");

          const hasOpenRequest = get().consultations.some(
            (item) => item.childId === childId && openStatuses.includes(item.status),
          );
          if (hasOpenRequest) {
            return fail(
              "Existe um pedido em aberto para esta criança. Aguarde o encerramento antes de arquivar.",
            );
          }

          const updated: Child = {
            ...child,
            archived: true,
            archivedAt: new Date().toISOString(),
          };

          set((state) => ({
            children: state.children.map((item) =>
              item.id === childId ? updated : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        restoreChild: (childId) => {
          const child = get().children.find((item) => item.id === childId);
          if (!child) return fail("Criança não encontrada.");

          const updated: Child = {
            ...child,
            archived: false,
            archivedAt: undefined,
          };

          set((state) => ({
            children: state.children.map((item) =>
              item.id === childId ? updated : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        // --- pedidos ------------------------------------------------------
        /**
         * Submissão do pedido.
         *
         * Não há classificação automática: o pedido nasce sem prioridade
         * (`SEM_TRIAGEM`) e fica no estado «Aguardando triagem», como o §2 do
         * relatório exige. O aviso preventivo para sintomas potencialmente
         * graves é apresentado na interface e não altera o estado do pedido.
         */
        createConsultation: (input) => {
          const state = get();
          const child = state.children.find((item) => item.id === input.childId);

          const childName = child?.name ?? input.fallbackChildName ?? "";
          const childAge = child
            ? ageInYears(child.birthDate)
            : (input.fallbackChildAge ?? -1);

          if (!childName.trim()) return fail("Indique a criança do pedido.");

          const ageValidation = validateChildAge(childAge);
          if (!ageValidation.valid) return fail(ageValidation.error!);

          const location = normalizeNeighbourhood(input.location);
          if (!location) return fail("Indique o bairro de residência.");

          const hasSymptom =
            input.symptoms.length > 0 || Boolean(input.otherSymptom?.trim());
          if (!hasSymptom) return fail("Seleccione pelo menos um sintoma.");

          if (!input.consent) {
            return fail(
              "É necessário o consentimento do encarregado de educação para submeter o pedido.",
            );
          }

          // Um encarregado pode registar pedidos para crianças diferentes no
          // mesmo dia; o que se bloqueia é o pedido duplicado para a MESMA
          // criança enquanto o anterior estiver em aberto. O telefone não serve
          // de chave, porque é partilhado por todos os educandos.
          const openForChild = state.consultations.find((item) => {
            if (!openStatuses.includes(item.status)) return false;

            if (input.childId) return item.childId === input.childId;

            return (
              samePhone(item.phone, input.phone) &&
              item.childName.trim().toLowerCase() === childName.trim().toLowerCase()
            );
          });
          if (openForChild) {
            return fail(
              `Já existe um pedido em aberto (${openForChild.reference}) para ${childName}. Aguarde o contacto da equipa do HGM.`,
            );
          }

          const reference = `R-${state.nextReference}`;
          const now = new Date().toISOString();

          let guardian = input.guardianId
            ? state.users.find((item) => item.id === input.guardianId)
            : undefined;

          // Um número ainda não registado também tem um encarregado do outro
          // lado da linha: cria-se uma conta provisória e a criança fica desde
          // logo ligada a essa pessoa, em vez de ficar um pedido órfão.
          if (!guardian) {
            guardian = state.users.find(
              (item) =>
                item.role === "ENCARREGADO" && samePhone(item.phone, input.phone),
            );
          }

          const createdUsers: User[] = [];
          const createdChildren: Child[] = [];

          if (!guardian) {
            guardian = {
              id: makeId("USR"),
              name: input.fallbackGuardianName?.trim() || "Encarregado (USSD)",
              // Email técnico: a conta ainda não tem acesso à web.
              email: `ussd-${input.phone.replace(/\D/g, "")}@pendente.hgm.mz`,
              password: "",
              role: "ENCARREGADO",
              phone: input.phone.trim(),
              address: location,
              state: "PROVISORIA",
              createdAt: now,
            };
            createdUsers.push(guardian);
          }

          let linkedChild = child;

          if (!linkedChild) {
            linkedChild = state.children.find(
              (item) =>
                item.guardianId === guardian!.id &&
                item.name.trim().toLowerCase() === childName.trim().toLowerCase(),
            );
          }

          if (!linkedChild) {
            const birthYear = new Date().getFullYear() - Math.max(childAge, 0);
            linkedChild = {
              id: makeId("CRI"),
              guardianId: guardian.id,
              name: childName.trim(),
              // Sem data exacta no USSD: assume-se 1 de Janeiro do ano estimado.
              birthDate: `${birthYear}-01-01`,
              sex: "M",
              notes:
                "Registada automaticamente a partir de um pedido USSD — confirmar data de nascimento e sexo na activação da conta.",
              createdAt: now,
            };
            createdChildren.push(linkedChild);
          }

          const preferred = input.preferredDoctorId
            ? state.users.find(
                (item) =>
                  item.id === input.preferredDoctorId && item.role === "PEDIATRA",
              )
            : undefined;

          const consultation: Consultation = {
            id: makeId("TC"),
            reference,
            childId: linkedChild.id,
            childName: childName.trim(),
            childAgeYears: childAge,
            guardianId: guardian.id,
            guardianName: guardian.name,
            phone: input.phone.trim() || guardian.phone,
            location,
            symptoms: input.symptoms,
            otherSymptom: input.otherSymptom?.trim() ?? "",
            notes: input.notes?.trim() ?? "",
            channel: input.channel,
            // Sem triagem automática: a prioridade é atribuída por um
            // profissional de triagem.
            priority: "SEM_TRIAGEM",
            status: "AGUARDA_TRIAGEM",
            source: input.source,
            createdAt: now,
            consentGivenAt: now,

            triageProfessionalId: null,
            triageProfessionalName: null,
            triageObservations: "",
            triagedAt: null,
            triageOutcome: null,
            priorityHistory: [],

            preferredDoctorId: preferred?.id ?? null,
            preferredDoctorName: preferred?.name ?? null,
            assignedDoctorId: null,
            assignedDoctorName: null,
            assignedById: null,
            assignedByName: null,
            assignedAt: null,
            assignmentNote: "",
            reviewedAt: null,

            scheduledAt: null,
            durationMinutes: null,
            schedulingNotes: "",
            scheduleHistory: [],
            meetingLink: null,
            meetingLinkExpiresAt: null,
            accessNotifiedAt: null,

            clinicalNotes: "",
            guidance: "",
            prescriptions: [],
            referralReason: "",
            attachments: [],
            messages: [],
            accessLog: [],
            timeline: [
              {
                id: makeId("TL"),
                status: "SUBMETIDO",
                detail: `Pedido submetido por ${
                  input.source === "USSD" ? "USSD (*123#)" : "plataforma web"
                }.`,
                at: now,
                actorId: guardian.id,
                actorName: guardian.name,
                actorRole: "ENCARREGADO",
              },
              {
                id: makeId("TL"),
                status: "AGUARDA_TRIAGEM",
                detail: "Pedido colocado na fila de triagem.",
                at: now,
                actorId: null,
                actorName: "Plataforma",
                actorRole: "SISTEMA",
              },
            ],
            closedAt: null,
            cancelReason: "",
          };

          set((current) => ({
            users:
              createdUsers.length > 0
                ? [...current.users, ...createdUsers]
                : current.users,
            children:
              createdChildren.length > 0
                ? [...current.children, ...createdChildren]
                : current.children,
            consultations: [consultation, ...current.consultations],
            nextReference: current.nextReference + 1,
          }));

          // Notificações: encarregado, equipa de triagem e administrativo.
          notify(
            [userById(guardian.id)],
            notificationMessages.guardianRequestReceived(consultation),
            consultation,
          );
          notify(
            usersByRole("TRIAGEM"),
            notificationMessages.triageNewRequest(consultation),
            consultation,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminNewRequest(consultation),
            consultation,
          );

          return {
            ok: true,
            data: {
              consultation,
              message:
                "Pedido submetido. Será analisado por um profissional de triagem do HGM, que define a prioridade e o seguimento do atendimento.",
            },
          };
        },

        // --- triagem ------------------------------------------------------
        concludeTriage: (id, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const professional = userById(input.professionalId);
          if (!professional || professional.role !== "TRIAGEM") {
            return fail(
              "Apenas um profissional de triagem pode concluir a triagem de um pedido.",
            );
          }
          if (!triageQueueStatuses.includes(consultation.status)) {
            return fail(
              `Este pedido já foi triado (estado actual: ${statusLabels[consultation.status].toLowerCase()}).`,
            );
          }
          if (input.priority === "SEM_TRIAGEM") {
            return fail("Atribua uma prioridade ao pedido.");
          }
          if (input.observations.trim().length < 10) {
            return fail(
              "Registe as observações da triagem (pelo menos 10 caracteres).",
            );
          }
          if (input.outcome === "PRESENCIAL" && !input.referralReason?.trim()) {
            return fail(
              "Indique o motivo do encaminhamento para atendimento presencial.",
            );
          }

          const now = new Date().toISOString();
          const referral = input.referralReason?.trim() ?? "";

          const status: ConsultationStatus =
            input.outcome === "PRESENCIAL"
              ? "ENCAMINHADO_PRESENCIAL"
              : "TRIAGEM_CONCLUIDA";

          const entries: TimelineEntry[] = [
            timelineEntry(
              "TRIAGEM_CONCLUIDA",
              `Triagem concluída com prioridade ${priorityLabels[input.priority].toLowerCase()}.`,
              professional,
            ),
          ];

          if (input.outcome === "PRESENCIAL") {
            entries.push(
              timelineEntry("ENCAMINHADO_PRESENCIAL", referral, professional),
            );
          } else {
            entries.push({
              id: makeId("TL"),
              status: "AGUARDA_ATRIBUICAO",
              detail: "Pedido disponível para atribuição de pediatra.",
              at: now,
              actorId: null,
              actorName: "Plataforma",
              actorRole: "SISTEMA",
            });
          }

          const updated = commit(
            id,
            {
              priority: input.priority,
              status,
              triageProfessionalId: professional.id,
              triageProfessionalName: professional.name,
              triageObservations: input.observations.trim(),
              triagedAt: now,
              triageOutcome: input.outcome,
              referralReason: referral || consultation.referralReason,
              closedAt: input.outcome === "PRESENCIAL" ? now : null,
            },
            entries,
          );

          notify(
            [userById(updated.guardianId)],
            input.outcome === "PRESENCIAL"
              ? notificationMessages.guardianReferred(updated)
              : notificationMessages.guardianTriageConcluded(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            input.outcome === "PRESENCIAL"
              ? notificationMessages.adminReferred(updated)
              : notificationMessages.adminTriageConcluded(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        /**
         * Confirmar ou alterar a prioridade depois da triagem. Qualquer
         * alteração exige justificação e fica registada (§2 e §4).
         */
        reviewPriority: (id, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const professional = userById(input.professionalId);
          if (!professional || professional.role !== "TRIAGEM") {
            return fail(
              "Apenas um profissional de triagem pode alterar a prioridade de um pedido.",
            );
          }
          if (closedStatuses.includes(consultation.status)) {
            return fail("Este pedido já foi encerrado.");
          }
          if (input.priority === "SEM_TRIAGEM") {
            return fail("Indique a nova prioridade.");
          }
          if (input.priority === consultation.priority) {
            return fail(
              "A prioridade indicada é a mesma que já está atribuída. Escolha outra ou mantenha a actual.",
            );
          }
          if (input.justification.trim().length < 10) {
            return fail(
              "Justifique a alteração de prioridade (pelo menos 10 caracteres).",
            );
          }

          const change: PriorityChange = {
            id: makeId("PR"),
            from: consultation.priority,
            to: input.priority,
            justification: input.justification.trim(),
            byId: professional.id,
            byName: professional.name,
            at: new Date().toISOString(),
          };

          const updated = commit(
            id,
            {
              priority: input.priority,
              priorityHistory: [...consultation.priorityHistory, change],
            },
            [
              timelineEntry(
                consultation.status,
                `Prioridade alterada de ${priorityLabels[change.from].toLowerCase()} para ${priorityLabels[change.to].toLowerCase()}. Justificação: ${change.justification}`,
                professional,
              ),
            ],
          );

          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.triagePriorityChanged(
              updated,
              change.justification,
            ),
            updated,
          );
          notify(
            [userById(updated.assignedDoctorId)],
            notificationMessages.doctorPriorityChanged(
              updated,
              change.justification,
            ),
            updated,
          );

          return { ok: true, data: updated };
        },

        // --- atribuição ---------------------------------------------------
        assignDoctor: (id, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const actor = userById(input.assignedById);
          if (!actor || actor.role !== "ADMINISTRATIVO") {
            return fail("Apenas o perfil administrativo pode atribuir pedidos.");
          }
          if (
            !assignmentQueueStatuses.includes(consultation.status) &&
            !schedulingQueueStatuses.includes(consultation.status) &&
            consultation.status !== "CONSULTA_AGENDADA"
          ) {
            return fail(
              "Só é possível atribuir um pediatra depois da triagem e antes da realização da consulta.",
            );
          }

          const doctor = userById(input.doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Seleccione o pediatra a quem atribuir o pedido.");
          }
          if (doctor.state !== "ACTIVA") {
            return fail(
              "Este pediatra não tem a conta activa e não pode receber pedidos.",
            );
          }

          const reassigning = consultation.assignedDoctorId !== null;
          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              assignedDoctorId: doctor.id,
              assignedDoctorName: doctor.name,
              assignedById: actor.id,
              assignedByName: actor.name,
              assignedAt: now,
              assignmentNote: input.note?.trim() ?? "",
              status: "PEDIATRA_ATRIBUIDO",
              reviewedAt: null,
              // Uma reatribuição devolve o pedido à fase de agendamento.
              scheduledAt: reassigning ? null : consultation.scheduledAt,
              durationMinutes: reassigning ? null : consultation.durationMinutes,
              meetingLink: reassigning ? null : consultation.meetingLink,
              meetingLinkExpiresAt: reassigning
                ? null
                : consultation.meetingLinkExpiresAt,
            },
            [
              timelineEntry(
                "PEDIATRA_ATRIBUIDO",
                `${reassigning ? "Pedido reatribuído" : "Pedido atribuído"} a ${doctor.name}.${
                  input.note?.trim() ? ` Nota: ${input.note.trim()}` : ""
                }`,
                actor,
              ),
            ],
          );

          notify(
            [doctor],
            notificationMessages.doctorAssigned(updated),
            updated,
          );
          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianAssigned(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO").filter((item) => item.id !== actor.id),
            notificationMessages.adminAssigned(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        /**
         * Sem pediatra disponível, o pedido fica em «Aguardando atribuição» com
         * a nota administrativa — é a alternativa prevista no §7 quando a
         * preferência indicada está indisponível.
         */
        holdAssignment: (id, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const actor = userById(input.assignedById);
          if (!actor || actor.role !== "ADMINISTRATIVO") {
            return fail("Apenas o perfil administrativo pode colocar o pedido em espera.");
          }
          if (!assignmentQueueStatuses.includes(consultation.status)) {
            return fail("Só um pedido triado e sem pediatra pode ficar em espera.");
          }
          if (input.note.trim().length < 10) {
            return fail(
              "Registe o motivo da espera (pelo menos 10 caracteres) — ex.: preferência indisponível.",
            );
          }

          const updated = commit(
            id,
            {
              status: "AGUARDA_ATRIBUICAO",
              assignmentNote: input.note.trim(),
            },
            [
              timelineEntry(
                "AGUARDA_ATRIBUICAO",
                `Pedido em espera por disponibilidade. ${input.note.trim()}`,
                actor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianWaitingAssignment(
              updated,
              input.note.trim(),
            ),
            updated,
          );

          return { ok: true, data: updated };
        },

        // --- pediatra -----------------------------------------------------
        /** «Analisar pedido»: o pediatra confirma que consultou a triagem. */
        reviewRequest: (id, doctorId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra responsável pode analisar o pedido.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail("Este pedido está atribuído a outro pediatra.");
          }
          if (consultation.status !== "PEDIATRA_ATRIBUIDO") {
            return fail("Este pedido já foi analisado.");
          }

          const updated = commit(
            id,
            {
              status: "AGUARDA_AGENDAMENTO",
              reviewedAt: new Date().toISOString(),
            },
            [
              timelineEntry(
                "AGUARDA_AGENDAMENTO",
                "Dados da triagem analisados pelo pediatra. Horário por definir.",
                doctor,
              ),
            ],
          );

          return { ok: true, data: updated };
        },

        /** «Definir horário»: data, hora, duração, canal e observações (§8). */
        scheduleConsultation: (id, input) => {
          const state = get();
          const consultation = state.consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(input.byId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra responsável pode definir o horário.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail("Este pedido está atribuído a outro pediatra.");
          }
          if (!schedulingQueueStatuses.includes(consultation.status)) {
            return fail(
              "Só é possível definir o horário de um pedido atribuído e ainda sem agendamento. Para alterar um agendamento existente, use «Actualizar agendamento».",
            );
          }
          if (!input.scheduledAt) {
            return fail("Escolha a data e a hora da teleconsulta.");
          }

          const when = new Date(input.scheduledAt);
          if (Number.isNaN(when.getTime())) return fail("Data e hora inválidas.");
          if (when.getTime() < Date.now() - 60_000) {
            return fail(
              "A data e hora indicadas já passaram. Escolha um horário futuro para a teleconsulta.",
            );
          }
          if (when.getTime() > Date.now() + 180 * 86_400_000) {
            return fail("O agendamento não pode ultrapassar 180 dias.");
          }
          if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5) {
            return fail("Indique a duração prevista (pelo menos 5 minutos).");
          }
          if (input.durationMinutes > 180) {
            return fail("A duração prevista não pode ultrapassar 180 minutos.");
          }

          const scheduledAt = when.toISOString();
          const usesVideo = input.channel === "VIDEO";
          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              channel: input.channel,
              status: "CONSULTA_AGENDADA",
              scheduledAt,
              durationMinutes: input.durationMinutes,
              schedulingNotes: input.notes?.trim() ?? "",
              meetingLink: usesVideo
                ? buildMeetingLink(consultation.reference)
                : null,
              meetingLinkExpiresAt: usesVideo
                ? new Date(
                    when.getTime() + MEETING_LINK_GRACE_MINUTES * 60_000,
                  ).toISOString()
                : null,
              accessNotifiedAt: usesVideo ? now : null,
            },
            [
              timelineEntry(
                "CONSULTA_AGENDADA",
                `Horário definido para ${when.toLocaleString("pt-PT")} (${input.durationMinutes} min).${
                  input.notes?.trim() ? ` Observações: ${input.notes.trim()}` : ""
                }`,
                doctor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianScheduled(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminScheduled(updated),
            updated,
          );
          // Consulta já à porta: o pediatra recebe o aviso de aproximação (§9).
          if (when.getTime() - Date.now() <= UPCOMING_WINDOW_MINUTES * 60_000) {
            notify(
              [doctor],
              notificationMessages.doctorUpcoming(updated),
              updated,
            );
          }

          return { ok: true, data: updated };
        },

        /**
         * «Actualizar agendamento» (§8): exige nova data, nova hora e motivo;
         * guarda o horário anterior, o autor da alteração e notifica os
         * envolvidos.
         */
        updateSchedule: (id, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const actor = userById(input.byId);
          if (!actor) return fail("Utilizador não encontrado.");
          if (actor.role !== "PEDIATRA" || consultation.assignedDoctorId !== actor.id) {
            return fail(
              "Apenas o pediatra responsável pode actualizar o agendamento.",
            );
          }
          if (consultation.status !== "CONSULTA_AGENDADA") {
            return fail("Só é possível actualizar um agendamento já existente.");
          }
          if (!input.scheduledAt) {
            return fail("Indique a nova data e a nova hora.");
          }

          const when = new Date(input.scheduledAt);
          if (Number.isNaN(when.getTime())) return fail("Data e hora inválidas.");
          if (when.getTime() < Date.now() - 60_000) {
            return fail("A nova data e hora já passaram. Escolha um horário futuro.");
          }
          if (
            consultation.scheduledAt &&
            new Date(consultation.scheduledAt).getTime() === when.getTime() &&
            (input.durationMinutes ?? consultation.durationMinutes) ===
              consultation.durationMinutes
          ) {
            return fail(
              "A nova data e hora são iguais às actuais. Indique um horário diferente.",
            );
          }
          if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5) {
            return fail("Indique a duração prevista (pelo menos 5 minutos).");
          }
          if (input.reason.trim().length < 10) {
            return fail(
              "Indique o motivo da alteração do agendamento (pelo menos 10 caracteres).",
            );
          }

          const channel = input.channel ?? consultation.channel;
          const usesVideo = channel === "VIDEO";
          const now = new Date().toISOString();

          const change: ScheduleChange = {
            id: makeId("SC"),
            previousScheduledAt: consultation.scheduledAt,
            newScheduledAt: when.toISOString(),
            previousDurationMinutes: consultation.durationMinutes,
            newDurationMinutes: input.durationMinutes,
            reason: input.reason.trim(),
            byId: actor.id,
            byName: actor.name,
            at: now,
          };

          const updated = commit(
            id,
            {
              channel,
              scheduledAt: change.newScheduledAt,
              durationMinutes: input.durationMinutes,
              scheduleHistory: [...consultation.scheduleHistory, change],
              meetingLink: usesVideo
                ? buildMeetingLink(consultation.reference)
                : null,
              meetingLinkExpiresAt: usesVideo
                ? new Date(
                    when.getTime() + MEETING_LINK_GRACE_MINUTES * 60_000,
                  ).toISOString()
                : null,
              accessNotifiedAt: usesVideo ? now : consultation.accessNotifiedAt,
            },
            [
              timelineEntry(
                "CONSULTA_AGENDADA",
                `Agendamento actualizado: ${
                  change.previousScheduledAt
                    ? new Date(change.previousScheduledAt).toLocaleString("pt-PT")
                    : "sem horário"
                } → ${when.toLocaleString("pt-PT")}. Motivo: ${change.reason}`,
                actor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianRescheduled(updated, change.reason),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminRescheduled(updated, change.reason),
            updated,
          );
          if (when.getTime() - Date.now() <= UPCOMING_WINDOW_MINUTES * 60_000) {
            notify([actor], notificationMessages.doctorUpcoming(updated), updated);
          }

          return { ok: true, data: updated };
        },

        startConsultation: (id, doctorId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra responsável pode iniciar a consulta.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail("Este pedido está atribuído a outro pediatra.");
          }
          if (consultation.status !== "CONSULTA_AGENDADA") {
            return fail(
              "Só é possível realizar uma consulta que esteja agendada.",
            );
          }
          if (!consultation.consentGivenAt) {
            return fail(
              "Falta o consentimento do encarregado de educação para a teleconsulta.",
            );
          }

          const updated = commit(
            id,
            { status: "CONSULTA_EM_CURSO" },
            [timelineEntry("CONSULTA_EM_CURSO", "Teleconsulta iniciada.", doctor)],
          );

          return { ok: true, data: updated };
        },

        completeConsultation: (id, payload) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(payload.byId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra responsável pode encerrar a consulta.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail("Este pedido está atribuído a outro pediatra.");
          }
          if (
            consultation.status !== "CONSULTA_EM_CURSO" &&
            consultation.status !== "CONSULTA_AGENDADA"
          ) {
            return fail("Esta consulta não está em condições de ser concluída.");
          }
          if (!payload.guidance.trim()) {
            return fail("Registe a orientação clínica antes de encerrar.");
          }

          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              status: "CONSULTA_CONCLUIDA",
              clinicalNotes: payload.clinicalNotes.trim(),
              guidance: payload.guidance.trim(),
              closedAt: now,
              // Encerrada a consulta, o acesso à sala deixa de ser válido.
              meetingLinkExpiresAt: now,
            },
            [
              timelineEntry(
                "CONSULTA_CONCLUIDA",
                "Teleconsulta concluída e registo clínico preenchido.",
                doctor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianGuidance(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminCompleted(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        referConsultation: (id, reason, byId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (!reason.trim()) return fail("Indique o motivo do encaminhamento.");
          if (closedStatuses.includes(consultation.status)) {
            return fail("Este pedido já foi encerrado.");
          }

          const actor = userById(byId);
          if (!actor) return fail("Utilizador não encontrado.");

          const allowed =
            (actor.role === "PEDIATRA" &&
              consultation.assignedDoctorId === actor.id) ||
            actor.role === "TRIAGEM";
          if (!allowed) {
            return fail(
              "O encaminhamento para atendimento presencial é registado pelo profissional de triagem ou pelo pediatra responsável.",
            );
          }

          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              status: "ENCAMINHADO_PRESENCIAL",
              referralReason: reason.trim(),
              closedAt: now,
              meetingLinkExpiresAt: now,
            },
            [
              timelineEntry(
                "ENCAMINHADO_PRESENCIAL",
                `Encaminhado para atendimento presencial. ${reason.trim()}`,
                actor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianReferred(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminReferred(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        /**
         * Cancelar deixou de apagar o pedido: «Cancelado» é um dos estados da
         * lista do §3 e o registo fica preservado para auditoria.
         */
        cancelConsultation: (id, reason, byId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (!openStatuses.includes(consultation.status)) {
            return fail("Este pedido já foi encerrado.");
          }
          if (consultation.status === "CONSULTA_EM_CURSO") {
            return fail(
              "A consulta está a decorrer e não pode ser cancelada. Conclua o atendimento.",
            );
          }

          const actor = userById(byId);
          if (!actor) return fail("Utilizador não encontrado.");

          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              status: "CANCELADO",
              cancelReason: reason.trim(),
              closedAt: now,
              meetingLinkExpiresAt: now,
            },
            [
              timelineEntry(
                "CANCELADO",
                reason.trim() || "Pedido cancelado.",
                actor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianCancelled(updated),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.adminCancelled(updated),
            updated,
          );
          notify(
            [userById(updated.assignedDoctorId)],
            notificationMessages.doctorRelevantUpdate(
              updated,
              "O pedido foi cancelado e saiu da sua agenda",
            ),
            updated,
          );

          return { ok: true, data: updated };
        },

        /** O encarregado pede a alteração do horário marcado. */
        requestScheduleChange: (id, reason, byId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (consultation.status !== "CONSULTA_AGENDADA") {
            return fail(
              "Só é possível pedir a alteração de uma consulta já agendada.",
            );
          }
          if (reason.trim().length < 10) {
            return fail(
              "Explique o motivo do pedido de alteração (pelo menos 10 caracteres).",
            );
          }

          const actor = userById(byId);
          if (!actor) return fail("Utilizador não encontrado.");

          const updated = commit(
            id,
            {},
            [
              timelineEntry(
                consultation.status,
                `Pedido de alteração do agendamento. Motivo: ${reason.trim()}`,
                actor,
              ),
            ],
          );

          notify(
            [userById(updated.assignedDoctorId)],
            notificationMessages.doctorChangeRequest(updated, reason.trim()),
            updated,
          );
          notify(
            usersByRole("ADMINISTRATIVO"),
            notificationMessages.doctorChangeRequest(updated, reason.trim()),
            updated,
          );

          return { ok: true, data: updated };
        },

        /** Reabre a janela de acesso à sala e notifica o encarregado. */
        resendRoomAccess: (id, byId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (consultation.channel !== "VIDEO") {
            return fail(
              "Esta teleconsulta não é por videochamada — não há acesso de sala para reenviar.",
            );
          }
          if (!consultation.scheduledAt) {
            return fail("Defina o horário da teleconsulta antes de enviar o acesso.");
          }
          if (closedStatuses.includes(consultation.status)) {
            return fail(
              "Esta teleconsulta já foi encerrada — o acesso à sala deixou de ser válido.",
            );
          }

          const actor = userById(byId);

          // O prazo original conta a partir da hora marcada. Se essa hora já
          // passou, o reenvio abre uma nova janela a contar de agora.
          const scheduled = new Date(consultation.scheduledAt).getTime();
          const base = Math.max(scheduled, Date.now());
          const now = new Date().toISOString();

          const updated = commit(
            id,
            {
              meetingLink: buildMeetingLink(consultation.reference),
              meetingLinkExpiresAt: new Date(
                base + MEETING_LINK_GRACE_MINUTES * 60_000,
              ).toISOString(),
              accessNotifiedAt: now,
            },
            [
              timelineEntry(
                consultation.status,
                "Novo acesso à sala disponibilizado ao encarregado (notificação simulada).",
                actor ?? null,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianScheduled(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        // --- prescrição ---------------------------------------------------
        addPrescription: (id, doctorId, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra pode criar uma prescrição.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail(
              "Só o pediatra responsável pelo pedido pode registar a prescrição.",
            );
          }

          const validation = validatePrescription(input);
          if (validation) return fail(validation);

          const now = new Date().toISOString();
          const prescription: Prescription = {
            id: makeId("PRE"),
            medication: input.medication.trim(),
            dosage: input.dosage.trim(),
            frequency: input.frequency.trim(),
            duration: input.duration.trim(),
            route: input.route,
            recommendations: input.recommendations?.trim() ?? "",
            issuedAt: now,
            doctorId: doctor.id,
            doctorName: doctor.name,
            doctorLicenseNumber: doctor.licenseNumber ?? "",
          };

          const updated = commit(
            id,
            { prescriptions: [...consultation.prescriptions, prescription] },
            [
              timelineEntry(
                consultation.status,
                `Prescrição demonstrativa registada: ${prescription.medication}.`,
                doctor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianPrescription(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        updatePrescription: (id, prescriptionId, doctorId, input) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra pode alterar uma prescrição.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail(
              "Só o pediatra responsável pelo pedido pode alterar a prescrição.",
            );
          }

          const existing = consultation.prescriptions.find(
            (item) => item.id === prescriptionId,
          );
          if (!existing) return fail("Prescrição não encontrada.");

          const validation = validatePrescription(input);
          if (validation) return fail(validation);

          const updatedPrescription: Prescription = {
            ...existing,
            medication: input.medication.trim(),
            dosage: input.dosage.trim(),
            frequency: input.frequency.trim(),
            duration: input.duration.trim(),
            route: input.route,
            recommendations: input.recommendations?.trim() ?? "",
            updatedAt: new Date().toISOString(),
          };

          const updated = commit(
            id,
            {
              prescriptions: consultation.prescriptions.map((item) =>
                item.id === prescriptionId ? updatedPrescription : item,
              ),
            },
            [
              timelineEntry(
                consultation.status,
                `Prescrição alterada: ${updatedPrescription.medication}.`,
                doctor,
              ),
            ],
          );

          notify(
            [userById(updated.guardianId)],
            notificationMessages.guardianPrescription(updated),
            updated,
          );

          return { ok: true, data: updated };
        },

        removePrescription: (id, prescriptionId, doctorId) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const doctor = userById(doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("Apenas o pediatra pode eliminar uma prescrição.");
          }
          if (consultation.assignedDoctorId !== doctor.id) {
            return fail(
              "Só o pediatra responsável pelo pedido pode eliminar a prescrição.",
            );
          }

          const existing = consultation.prescriptions.find(
            (item) => item.id === prescriptionId,
          );
          if (!existing) return fail("Prescrição não encontrada.");

          const updated = commit(
            id,
            {
              prescriptions: consultation.prescriptions.filter(
                (item) => item.id !== prescriptionId,
              ),
            },
            [
              timelineEntry(
                consultation.status,
                `Prescrição eliminada: ${existing.medication}.`,
                doctor,
              ),
            ],
          );

          return { ok: true, data: updated };
        },

        sendMessage: (id, message) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (!message.text.trim()) return fail("Escreva uma mensagem.");

          const entry: ChatMessage = {
            ...message,
            text: message.text.trim(),
            id: makeId("MSG"),
            sentAt: new Date().toISOString(),
          };

          const updated = commit(id, {
            messages: [...consultation.messages, entry],
          });

          return { ok: true, data: updated };
        },

        addAttachment: (id, attachment) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");
          if (!attachment.name.trim()) return fail("Indique o nome do ficheiro.");

          const entry: Attachment = {
            id: makeId("ATT"),
            name: attachment.name.trim(),
            kind: attachment.kind,
            addedAt: new Date().toISOString(),
            mimeType: attachment.mimeType,
            size: attachment.size,
            dataUrl: attachment.dataUrl,
          };

          const updated = commit(id, {
            attachments: [...consultation.attachments, entry],
          });

          return { ok: true, data: updated };
        },

        grantExceptionalAccess: (id, entry) => {
          const consultation = get().consultations.find((item) => item.id === id);
          if (!consultation) return fail("Pedido não encontrado.");

          const log: AccessLogEntry = {
            id: makeId("LOG"),
            userId: entry.userId,
            userName: entry.userName,
            reason: entry.reason,
            note: entry.note?.trim() ?? "",
            at: new Date().toISOString(),
          };

          const actor = userById(entry.userId);

          const updated = commit(
            id,
            { accessLog: [...(consultation.accessLog ?? []), log] },
            [
              timelineEntry(
                consultation.status,
                `Acesso excepcional ao processo clínico registado para auditoria (${entry.reason.toLowerCase()}).`,
                actor ?? null,
              ),
            ],
          );

          return { ok: true, data: updated };
        },

        // --- disponibilidade ----------------------------------------------
        addAvailability: (input) => {
          const doctor = userById(input.doctorId);
          if (!doctor || doctor.role !== "PEDIATRA") {
            return fail("A disponibilidade é registada por um pediatra.");
          }

          const validation = validateAvailabilityWindow(input);
          if (!validation.valid) return fail(validation.error!);

          const entry: Availability = {
            id: makeId("DISP"),
            doctorId: doctor.id,
            doctorName: doctor.name,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            durationMinutes: input.durationMinutes,
            modality: input.modality,
            state: input.state ?? "ACTIVA",
            kind: input.kind,
            notes: input.notes?.trim() ?? "",
            createdAt: new Date().toISOString(),
          };

          set((state) => ({ availability: [entry, ...state.availability] }));
          return { ok: true, data: entry };
        },

        updateAvailability: (id, patch) => {
          const entry = get().availability.find((item) => item.id === id);
          if (!entry) return fail("Disponibilidade não encontrada.");

          const merged = { ...entry, ...patch };
          const validation = validateAvailabilityWindow(merged);
          if (!validation.valid) return fail(validation.error!);

          const updated: Availability = {
            ...merged,
            notes: merged.notes?.trim() ?? "",
            id: entry.id,
            doctorId: entry.doctorId,
            doctorName: entry.doctorName,
            createdAt: entry.createdAt,
          };

          set((state) => ({
            availability: state.availability.map((item) =>
              item.id === id ? updated : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        cancelAvailability: (id) => {
          const entry = get().availability.find((item) => item.id === id);
          if (!entry) return fail("Disponibilidade não encontrada.");

          const updated: Availability = { ...entry, state: "CANCELADA" };

          set((state) => ({
            availability: state.availability.map((item) =>
              item.id === id ? updated : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        removeAvailability: (id) => {
          set((state) => ({
            availability: state.availability.filter((item) => item.id !== id),
          }));
          return { ok: true, data: undefined };
        },

        // --- notificações -------------------------------------------------
        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((item) =>
              item.id === id && !item.readAt
                ? { ...item, readAt: new Date().toISOString() }
                : item,
            ),
          })),

        markAllNotificationsRead: (userId) =>
          set((state) => ({
            notifications: state.notifications.map((item) =>
              item.userId === userId && !item.readAt
                ? { ...item, readAt: new Date().toISOString() }
                : item,
            ),
          })),

        clearNotifications: (userId) =>
          set((state) => ({
            notifications: state.notifications.filter(
              (item) => item.userId !== userId,
            ),
          })),

        // --- administração ------------------------------------------------
        createUser: (input) => {
          const email = normalizeEmail(input.email);

          if (!input.name.trim()) return fail("Indique o nome do utilizador.");
          if (!isEmail(email)) {
            return fail("Indique um email válido (ex.: nome@hgm.mz).");
          }
          if (input.password.length < 6) {
            return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
          }
          if (input.phone.replace(/\D/g, "").length < 9) {
            return fail("Indique um número de telefone válido (9 dígitos).");
          }
          if (get().users.some((user) => normalizeEmail(user.email) === email)) {
            return fail("Já existe um utilizador com este email.");
          }
          if (input.role === "PEDIATRA") {
            if (!input.specialty?.trim()) {
              return fail("Indique a especialidade do pediatra.");
            }
            if (!input.licenseNumber?.trim()) {
              return fail("Indique o número da Ordem dos Médicos.");
            }
            if (!input.shift) {
              return fail("Indique o turno de escala do pediatra.");
            }
          }

          const user: User = {
            id: makeId("USR"),
            name: input.name.trim(),
            email,
            password: input.password,
            role: input.role,
            phone: input.phone.trim(),
            specialty: input.specialty?.trim(),
            licenseNumber: input.licenseNumber?.trim(),
            shift: input.role === "PEDIATRA" ? input.shift : undefined,
            available:
              input.role === "PEDIATRA" ? (input.available ?? true) : undefined,
            address: input.address?.trim()
              ? normalizeNeighbourhood(input.address)
              : undefined,
            idDocument: input.idDocument?.trim(),
            state: "ACTIVA",
            createdAt: new Date().toISOString(),
          };

          set((state) => ({ users: [...state.users, user] }));
          return { ok: true, data: user };
        },

        updateUser: (userId, patch) => get().updateProfile(userId, patch),

        setUserState: (userId, state) => {
          const user = get().users.find((item) => item.id === userId);
          if (!user) return fail("Utilizador não encontrado.");

          if (state === "ACTIVA" && user.state === "PROVISORIA") {
            return fail(
              "Esta conta é provisória (criada por um pedido USSD). Use «Activar conta» para definir o email e a palavra-passe definitivos.",
            );
          }
          if (state === "ACTIVA" && !user.password) {
            return fail(
              "Esta conta não tem palavra-passe definida. Defina-a antes de a activar.",
            );
          }

          const updated: User = {
            ...user,
            state,
            activatedAt: state === "ACTIVA" ? new Date().toISOString() : user.activatedAt,
          };

          set((current) => ({
            users: current.users.map((item) =>
              item.id === userId ? updated : item,
            ),
            // Uma conta que perde o acesso perde também a sessão aberta.
            sessionUserId:
              state !== "ACTIVA" && current.sessionUserId === userId
                ? null
                : current.sessionUserId,
          }));

          return { ok: true, data: updated };
        },

        /**
         * Activação de uma conta provisória do USSD (§11 do relatório).
         *
         * No protótipo testado, alterar o email e a palavra-passe de uma conta
         * provisória não bastava: as credenciais continuavam a não ser
         * reconhecidas porque a conta permanecia marcada como provisória. Aqui a
         * activação é uma operação própria, que cria de facto as credenciais,
         * passa a conta a activa e mantém os pedidos USSD associados ao mesmo
         * encarregado.
         */
        activateProvisionalAccount: (userId, input) => {
          const user = get().users.find((item) => item.id === userId);
          if (!user) return fail("Utilizador não encontrado.");
          if (user.state !== "PROVISORIA") {
            return fail("Esta conta já não é provisória.");
          }

          const email = normalizeEmail(input.email);
          if (!isEmail(email)) {
            return fail("Indique um email válido para a conta definitiva.");
          }
          if (
            get().users.some(
              (item) => item.id !== userId && normalizeEmail(item.email) === email,
            )
          ) {
            return fail("Já existe uma conta registada com este email.");
          }
          if (input.password.length < 6) {
            return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
          }

          const now = new Date().toISOString();
          const updated: User = {
            ...user,
            name: input.name?.trim() || user.name,
            email,
            password: input.password,
            idDocument: input.idDocument?.trim() || user.idDocument,
            state: "ACTIVA",
            activatedAt: now,
          };

          set((state) => ({
            users: state.users.map((item) =>
              item.id === userId ? updated : item,
            ),
            // Os pedidos submetidos por USSD continuam ligados a este
            // encarregado — é precisamente o que o relatório exige.
            consultations: state.consultations.map((item) =>
              item.guardianId === userId
                ? { ...item, guardianName: updated.name }
                : item,
            ),
          }));

          return { ok: true, data: updated };
        },

        /**
         * Eliminação administrativa só para contas sem qualquer actividade no
         * sistema. Um pediatra com consultas registadas ou um encarregado com
         * pedidos nunca são apagados — apenas desactivados.
         */
        removeUser: (userId) => {
          const state = get();
          const user = state.users.find((item) => item.id === userId);
          if (!user) return fail("Utilizador não encontrado.");
          if (state.sessionUserId === userId) {
            return fail("Não pode eliminar a conta com que está autenticado.");
          }

          const hasConsultations = state.consultations.some(
            (item) =>
              item.assignedDoctorId === userId ||
              item.guardianId === userId ||
              item.triageProfessionalId === userId,
          );
          const hasChildren = state.children.some(
            (item) => item.guardianId === userId,
          );

          if (hasConsultations || hasChildren) {
            return fail(
              user.role === "PEDIATRA" || user.role === "TRIAGEM"
                ? "Este profissional tem pedidos registados. A identificação e o histórico têm de ser preservados — desactive a conta em vez de a eliminar."
                : "Este utilizador tem crianças ou pedidos associados. Desactive a conta para preservar o histórico clínico.",
            );
          }

          set((current) => ({
            users: current.users.filter((item) => item.id !== userId),
            availability: current.availability.filter(
              (item) => item.doctorId !== userId,
            ),
            notifications: current.notifications.filter(
              (item) => item.userId !== userId,
            ),
          }));

          return { ok: true, data: undefined };
        },

        // --- demonstração -------------------------------------------------
        syncDemoDay: () => {
          const state = get();
          const today = new Date().toDateString();
          if (state.demoDaySyncedAt === today) return;

          const now = new Date();
          const refreshed = buildSeedConsultations(now);
          const refreshedById = new Map(refreshed.map((item) => [item.id, item]));

          // Só os registos semeados são reposicionados; o que o utilizador
          // criou durante a demonstração fica intacto.
          const consultations = state.consultations.map((item) =>
            item.seeded && refreshedById.has(item.id)
              ? { ...refreshedById.get(item.id)!, ...pickUserEdits(item) }
              : item,
          );

          const seededAvailability = buildSeedAvailability(now);
          const seededIds = new Set(seededAvailability.map((item) => item.id));

          set({
            consultations,
            availability: [
              ...seededAvailability,
              ...state.availability.filter((item) => !seededIds.has(item.id)),
            ],
            // As notificações semeadas acompanham as datas dos pedidos.
            notifications: [
              ...state.notifications.filter(
                (item) => !item.id.startsWith("NOT-SEED-"),
              ),
              ...buildSeedNotifications(
                consultations.filter((item) => item.seeded),
                state.users,
              ),
            ].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
            demoDaySyncedAt: today,
          });
        },

        resetDemo: () => set({ ...initialState(), demoDaySyncedAt: null }),
      };
    },
    {
      name: "hgm-telepediatria",
      /**
       * v4: quatro perfis, onze estados do pedido, triagem humana, atribuição
       * administrativa, disponibilidade, notificações internas e prescrição.
       * Os estados anteriores são descartados por não terem estes campos.
       */
      version: 4,
      migrate: () => initialState(),
      partialize: (state) => ({
        users: state.users,
        children: state.children,
        consultations: state.consultations,
        availability: state.availability,
        notifications: state.notifications,
        sessionUserId: state.sessionUserId,
        nextReference: state.nextReference,
        demoDaySyncedAt: state.demoDaySyncedAt,
      }),
    },
  ),
);

function validatePrescription(input: PrescriptionInput): string | null {
  if (input.medication.trim().length < 3) {
    return "Indique o medicamento da prescrição.";
  }
  if (!input.dosage.trim()) return "Indique a dosagem.";
  if (!input.frequency.trim()) return "Indique a frequência de administração.";
  if (!input.duration.trim()) return "Indique a duração do tratamento.";
  if (!input.route) return "Indique a via de administração.";
  return null;
}

/** Campos que o utilizador pode ter alterado num registo semeado. */
function pickUserEdits(consultation: Consultation): Partial<Consultation> {
  const edits: Partial<Consultation> = {
    status: consultation.status,
    priority: consultation.priority,
    clinicalNotes: consultation.clinicalNotes,
    guidance: consultation.guidance,
    referralReason: consultation.referralReason,
    cancelReason: consultation.cancelReason,
    triageObservations: consultation.triageObservations,
    triageProfessionalId: consultation.triageProfessionalId,
    triageProfessionalName: consultation.triageProfessionalName,
    triageOutcome: consultation.triageOutcome,
    assignedDoctorId: consultation.assignedDoctorId,
    assignedDoctorName: consultation.assignedDoctorName,
    assignmentNote: consultation.assignmentNote,
  };

  if (consultation.messages.length > 0) edits.messages = consultation.messages;
  if (consultation.attachments.length > 0) {
    edits.attachments = consultation.attachments;
  }
  if (consultation.accessLog?.length > 0) {
    edits.accessLog = consultation.accessLog;
  }
  if (consultation.prescriptions.length > 0) {
    edits.prescriptions = consultation.prescriptions;
  }
  if (consultation.priorityHistory.length > 0) {
    edits.priorityHistory = consultation.priorityHistory;
  }

  return edits;
}

export { DEMO_PASSWORD };

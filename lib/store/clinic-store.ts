"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEMO_PASSWORD,
  SEED_ANCHOR,
  SEED_REFERENCE_START,
  buildSeedConsultations,
  seedChildren,
  seedUsers,
} from "../data/seed";
import type {
  AccessLogEntry,
  AccessReason,
  Attachment,
  AttachmentKind,
  ChatMessage,
  Consultation,
  ConsultationChannel,
  ConsultationPriority,
} from "../types/consultation";
import { closedStatuses, openStatuses } from "../types/consultation";
import type { Child, Shift, User, UserRole } from "../types/user";
import { ageInYears } from "../utils/date";
import { triage, validateChildAge } from "../utils/triage";

/** O link da videochamada expira 10 minutos depois da hora marcada. */
export const MEETING_LINK_GRACE_MINUTES = 10;

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
};

export type ScheduleInput = {
  scheduledAt: string;
  doctorId: string;
  channel?: ConsultationChannel;
};

export type CompleteInput = {
  clinicalNotes: string;
  guidance: string;
  /**
   * Classificação final atribuída pelo pediatra. Um pedido que entrou como
   * "Avaliação necessária" tem de sair da consulta com uma prioridade real —
   * era o que ficava por resolver no protótipo anterior.
   */
  priority?: ConsultationPriority;
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

type ClinicState = {
  users: User[];
  children: Child[];
  consultations: Consultation[];
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
  ) => ActionResult<{ consultation: Consultation; message: string; isEmergency: boolean }>;
  scheduleConsultation: (id: string, input: ScheduleInput) => ActionResult<Consultation>;
  startConsultation: (id: string, doctorId: string) => ActionResult<Consultation>;
  completeConsultation: (
    id: string,
    payload: CompleteInput,
  ) => ActionResult<Consultation>;
  referConsultation: (
    id: string,
    reason: string,
    priority?: ConsultationPriority,
  ) => ActionResult<Consultation>;
  cancelConsultation: (id: string) => ActionResult<undefined>;
  resendMeetingLink: (id: string) => ActionResult<Consultation>;
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

  // --- administração ------------------------------------------------------
  createUser: (input: CreateUserInput) => ActionResult<User>;
  updateUser: (userId: string, patch: Partial<User>) => ActionResult<User>;
  setUserActive: (userId: string, active: boolean) => ActionResult<User>;
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

function initialState() {
  return {
    users: seedUsers,
    children: seedChildren,
    consultations: buildSeedConsultations(SEED_ANCHOR),
    sessionUserId: null,
    nextReference: SEED_REFERENCE_START,
    demoDaySyncedAt: null,
  };
}

export const useClinicStore = create<ClinicState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // --- autenticação ---------------------------------------------------
      login: (email, password) => {
        const user = get().users.find(
          (item) => normalizeEmail(item.email) === normalizeEmail(email),
        );

        if (!user) {
          return fail(
            "Não existe nenhuma conta com este email. Verifique o endereço ou crie uma conta.",
          );
        }
        if (user.provisional || !user.password) {
          return fail(
            "Esta conta foi criada a partir de um pedido USSD e ainda não tem palavra-passe. Conclua o registo em «Criar conta» com o mesmo número de telemóvel.",
          );
        }
        if (user.password !== password) return fail("Palavra-passe incorrecta.");
        if (!user.active) {
          return fail("Esta conta está desactivada. Contacte a administração do HGM.");
        }

        set({ sessionUserId: user.id });
        return { ok: true, data: user };
      },

      logout: () => set({ sessionUserId: null }),

      register: (input) => {
        const email = normalizeEmail(input.email);

        if (!input.name.trim()) return fail("Indique o nome completo.");
        if (!email) return fail("Indique um email válido.");
        if (input.password.length < 6) {
          return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
        }
        if (!input.phone.trim()) return fail("Indique o número de telefone.");
        if (get().users.some((user) => normalizeEmail(user.email) === email)) {
          return fail("Já existe uma conta registada com este email.");
        }

        const now = new Date().toISOString();

        // Um pedido USSD feito a partir de um número ainda não registado cria
        // uma conta provisória. Quando essa família se regista na web com o
        // mesmo número, a conta é assumida — em vez de duplicada — e as
        // crianças e os pedidos já existentes passam a ser visíveis.
        const provisional = get().users.find(
          (item) =>
            item.provisional && samePhone(item.phone, input.phone) && item.active,
        );

        if (provisional) {
          const claimed: User = {
            ...provisional,
            name: input.name.trim(),
            email,
            password: input.password,
            phone: input.phone.trim(),
            idDocument: input.idDocument.trim(),
            address: input.address.trim(),
            provisional: false,
          };

          const extraChild: Child | null = input.child
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

          // Evita duplicar a criança que já tinha sido criada pelo USSD.
          const alreadyRegistered = get().children.some(
            (child) =>
              child.guardianId === claimed.id &&
              child.name.trim().toLowerCase() ===
                (input.child?.name.trim().toLowerCase() ?? ""),
          );

          set((state) => ({
            users: state.users.map((item) =>
              item.id === claimed.id ? claimed : item,
            ),
            children:
              extraChild && !alreadyRegistered
                ? [...state.children, extraChild]
                : state.children,
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
          address: input.address.trim(),
          active: true,
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
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return fail("Indique um email válido.");
          }
          const taken = get().users.some(
            (item) => item.id !== userId && normalizeEmail(item.email) === email,
          );
          if (taken) return fail("Esse email já está associado a outra conta.");
        }

        if (patch.password !== undefined && patch.password.length < 6) {
          return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
        }

        if (patch.phone !== undefined && patch.phone.replace(/\D/g, "").length < 9) {
          return fail("Indique um número de telefone válido (9 dígitos).");
        }

        const updated: User = { ...user, ...patch, id: user.id };

        set((state) => ({
          users: state.users.map((item) => (item.id === userId ? updated : item)),
        }));

        return { ok: true, data: updated };
      },

      // --- crianças -------------------------------------------------------
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

      // --- pedidos --------------------------------------------------------
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

        if (!input.location.trim()) return fail("Indique a localização (bairro / avenida).");

        const hasSymptom =
          input.symptoms.length > 0 || Boolean(input.otherSymptom?.trim());
        if (!hasSymptom) return fail("Seleccione pelo menos um sintoma.");

        // Um encarregado pode registar pedidos para crianças diferentes no
        // mesmo dia; o que se bloqueia é o pedido duplicado para a MESMA
        // criança enquanto o anterior estiver em aberto. O telefone não serve
        // de chave, porque é partilhado por todos os educandos.
        const openForChild = state.consultations.find((item) => {
          if (!openStatuses.includes(item.status)) return false;

          if (input.childId) return item.childId === input.childId;

          // Pedido USSD sem conta associada: identifica-se a criança pela
          // combinação nome + telefone, nunca só pelo telefone — o mesmo
          // número pertence ao encarregado de vários educandos.
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

        const result = triage({
          symptoms: input.symptoms,
          otherSymptom: input.otherSymptom,
        });

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
            address: input.location.trim(),
            active: true,
            createdAt: now,
            provisional: true,
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
              "Registada automaticamente a partir de um pedido USSD — confirmar data de nascimento e sexo no registo web.",
            createdAt: now,
          };
          createdChildren.push(linkedChild);
        }

        const consultation: Consultation = {
          id: makeId("TC"),
          reference,
          childId: linkedChild.id,
          childName: childName.trim(),
          childAgeYears: childAge,
          guardianId: guardian.id,
          guardianName: guardian.name,
          phone: input.phone.trim() || guardian.phone,
          location: input.location.trim(),
          symptoms: input.symptoms,
          otherSymptom: input.otherSymptom?.trim() ?? "",
          notes: input.notes?.trim() ?? "",
          channel: input.channel,
          priority: result.priority,
          status: result.status,
          source: input.source,
          createdAt: now,
          scheduledAt: null,
          meetingLink: null,
          meetingLinkExpiresAt: null,
          smsSentAt: null,
          assignedDoctorId: null,
          assignedDoctorName: null,
          clinicalNotes: "",
          guidance: "",
          referralReason: result.isEmergency
            ? "Sintoma crítico detectado na triagem automática — encaminhamento imediato."
            : "",
          attachments: [],
          messages: [],
          accessLog: [],
          closedAt: result.isEmergency ? now : null,
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

        return {
          ok: true,
          data: {
            consultation,
            message: result.message,
            isEmergency: result.isEmergency,
          },
        };
      },

      scheduleConsultation: (id, input) => {
        const state = get();
        const consultation = state.consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (!input.scheduledAt) return fail("Escolha a data e a hora da teleconsulta.");

        const when = new Date(input.scheduledAt);
        if (Number.isNaN(when.getTime())) {
          return fail("Data e hora inválidas.");
        }
        // Uma teleconsulta nunca pode ser marcada para um momento que já passou.
        if (when.getTime() < Date.now() - 60_000) {
          return fail(
            "A data e hora indicadas já passaram. Escolha um horário futuro para a teleconsulta.",
          );
        }
        if (when.getTime() > Date.now() + 180 * 86_400_000) {
          return fail("O agendamento não pode ultrapassar 180 dias.");
        }

        const doctor = state.users.find((item) => item.id === input.doctorId);
        if (!doctor) return fail("Seleccione o pediatra responsável.");

        const channel = input.channel ?? consultation.channel;
        const scheduledAt = new Date(input.scheduledAt).toISOString();
        const usesVideo = channel === "VIDEO";

        const updated: Consultation = {
          ...consultation,
          channel,
          status: "AGENDADA",
          scheduledAt,
          assignedDoctorId: doctor.id,
          assignedDoctorName: doctor.name,
          // O link só faz sentido em videochamada e expira pouco depois da
          // hora marcada.
          meetingLink: usesVideo ? buildMeetingLink(consultation.reference) : null,
          meetingLinkExpiresAt: usesVideo
            ? new Date(
                new Date(scheduledAt).getTime() + MEETING_LINK_GRACE_MINUTES * 60_000,
              ).toISOString()
            : null,
          smsSentAt: usesVideo ? new Date().toISOString() : null,
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return { ok: true, data: updated };
      },

      startConsultation: (id, doctorId) => {
        const state = get();
        const consultation = state.consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");

        const doctor = state.users.find((item) => item.id === doctorId);

        const updated: Consultation = {
          ...consultation,
          status: "EM_CURSO",
          assignedDoctorId: doctor?.id ?? consultation.assignedDoctorId,
          assignedDoctorName: doctor?.name ?? consultation.assignedDoctorName,
          scheduledAt: consultation.scheduledAt ?? new Date().toISOString(),
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return { ok: true, data: updated };
      },

      completeConsultation: (id, payload) => {
        const consultation = get().consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (!payload.guidance.trim()) {
          return fail("Registe a orientação clínica antes de encerrar.");
        }
        // "Avaliação necessária" é um estado de espera pela leitura de um
        // profissional. Depois do parecer, o pedido tem de sair com uma
        // classificação clínica real.
        if (consultation.priority === "AVALIACAO" && !payload.priority) {
          return fail(
            "Classifique a gravidade do caso (normal, urgente ou crítica) antes de concluir — o estado «Avaliação necessária» não pode ficar por resolver.",
          );
        }

        const updated: Consultation = {
          ...consultation,
          status: "CONCLUIDA",
          priority: payload.priority ?? consultation.priority,
          clinicalNotes: payload.clinicalNotes.trim(),
          guidance: payload.guidance.trim(),
          closedAt: new Date().toISOString(),
          // Encerrada a consulta, o link deixa de ser válido.
          meetingLinkExpiresAt: new Date().toISOString(),
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return { ok: true, data: updated };
      },

      referConsultation: (id, reason, priority) => {
        const consultation = get().consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (!reason.trim()) return fail("Indique o motivo do encaminhamento.");

        const updated: Consultation = {
          ...consultation,
          status: "ENCAMINHADA",
          // Um encaminhamento é sempre a leitura de um profissional: deixa de
          // fazer sentido manter "Avaliação necessária".
          priority:
            priority ??
            (consultation.priority === "AVALIACAO"
              ? "URGENTE"
              : consultation.priority),
          referralReason: reason.trim(),
          closedAt: new Date().toISOString(),
          meetingLinkExpiresAt: new Date().toISOString(),
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return { ok: true, data: updated };
      },

      cancelConsultation: (id) => {
        const consultation = get().consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (!openStatuses.includes(consultation.status)) {
          return fail("Este pedido já foi encerrado.");
        }

        set((current) => ({
          consultations: current.consultations.filter((item) => item.id !== id),
        }));

        return { ok: true, data: undefined };
      },

      resendMeetingLink: (id) => {
        const consultation = get().consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (consultation.channel !== "VIDEO") {
          return fail("Este pedido é por chamada de voz — não há link para enviar.");
        }
        if (!consultation.scheduledAt) {
          return fail("Agende a teleconsulta antes de enviar o link.");
        }

        if (closedStatuses.includes(consultation.status)) {
          return fail(
            "Esta teleconsulta já foi encerrada — o link deixou de ser válido e não pode ser reenviado.",
          );
        }

        // O prazo original conta a partir da hora marcada. Se essa hora já
        // passou, o reenvio abre uma nova janela a contar de agora — era o
        // que faltava no protótipo testado (R-1041).
        const scheduled = new Date(consultation.scheduledAt).getTime();
        const base = Math.max(scheduled, Date.now());

        const updated: Consultation = {
          ...consultation,
          meetingLink: buildMeetingLink(consultation.reference),
          meetingLinkExpiresAt: new Date(
            base + MEETING_LINK_GRACE_MINUTES * 60_000,
          ).toISOString(),
          smsSentAt: new Date().toISOString(),
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

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

        const updated: Consultation = {
          ...consultation,
          messages: [...consultation.messages, entry],
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

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

        const updated: Consultation = {
          ...consultation,
          attachments: [...consultation.attachments, entry],
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

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

        const updated: Consultation = {
          ...consultation,
          accessLog: [...(consultation.accessLog ?? []), log],
        };

        set((current) => ({
          consultations: current.consultations.map((item) =>
            item.id === id ? updated : item,
          ),
        }));

        return { ok: true, data: updated };
      },

      // --- administração --------------------------------------------------
      createUser: (input) => {
        const email = normalizeEmail(input.email);

        if (!input.name.trim()) return fail("Indique o nome do utilizador.");
        if (!email) return fail("Indique um email válido.");
        if (input.password.length < 6) {
          return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return fail("Indique um email válido (ex.: nome@hgm.mz).");
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
          available: input.role === "PEDIATRA" ? (input.available ?? true) : undefined,
          address: input.address?.trim(),
          idDocument: input.idDocument?.trim(),
          active: true,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ users: [...state.users, user] }));
        return { ok: true, data: user };
      },

      updateUser: (userId, patch) => get().updateProfile(userId, patch),

      setUserActive: (userId, active) => {
        const user = get().users.find((item) => item.id === userId);
        if (!user) return fail("Utilizador não encontrado.");

        const updated = { ...user, active };

        set((state) => ({
          users: state.users.map((item) => (item.id === userId ? updated : item)),
          // Desactivar a própria conta activa termina a sessão.
          sessionUserId:
            !active && state.sessionUserId === userId ? null : state.sessionUserId,
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
          (item) => item.assignedDoctorId === userId || item.guardianId === userId,
        );
        const hasChildren = state.children.some(
          (item) => item.guardianId === userId,
        );

        if (hasConsultations || hasChildren) {
          return fail(
            user.role === "PEDIATRA"
              ? "Este pediatra tem teleconsultas registadas. A identificação e o histórico têm de ser preservados — desactive a conta em vez de a eliminar."
              : "Este utilizador tem crianças ou pedidos associados. Desactive a conta para preservar o histórico clínico.",
          );
        }

        set((current) => ({
          users: current.users.filter((item) => item.id !== userId),
        }));

        return { ok: true, data: undefined };
      },

      // --- demonstração ---------------------------------------------------
      syncDemoDay: () => {
        const state = get();
        const today = new Date().toDateString();
        if (state.demoDaySyncedAt === today) return;

        const refreshed = buildSeedConsultations(new Date());
        const refreshedById = new Map(refreshed.map((item) => [item.id, item]));

        set({
          // Só os registos semeados são reposicionados; o que o utilizador
          // criou durante a demonstração fica intacto.
          consultations: state.consultations.map((item) =>
            item.seeded && refreshedById.has(item.id)
              ? { ...refreshedById.get(item.id)!, ...pickUserEdits(item) }
              : item,
          ),
          demoDaySyncedAt: today,
        });
      },

      resetDemo: () => set({ ...initialState(), demoDaySyncedAt: null }),
    }),
    {
      name: "hgm-telepediatria",
      // v3: pedidos ligados sempre a um encarregado, registo de auditoria,
      // turnos dos pediatras e arquivo de crianças. Estados anteriores são
      // descartados por não terem estes campos.
      version: 3,
      migrate: () => initialState(),
      partialize: (state) => ({
        users: state.users,
        children: state.children,
        consultations: state.consultations,
        sessionUserId: state.sessionUserId,
        nextReference: state.nextReference,
        demoDaySyncedAt: state.demoDaySyncedAt,
      }),
    },
  ),
);

/** Campos que o utilizador pode ter alterado num registo semeado. */
function pickUserEdits(consultation: Consultation): Partial<Consultation> {
  const edits: Partial<Consultation> = {
    status: consultation.status,
    priority: consultation.priority,
    clinicalNotes: consultation.clinicalNotes,
    guidance: consultation.guidance,
    referralReason: consultation.referralReason,
  };

  if (consultation.messages.length > 0) edits.messages = consultation.messages;
  if (consultation.attachments.length > 0) {
    edits.attachments = consultation.attachments;
  }
  if (consultation.accessLog?.length > 0) {
    edits.accessLog = consultation.accessLog;
  }

  return edits;
}

export { DEMO_PASSWORD };

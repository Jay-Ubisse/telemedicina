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
  Attachment,
  AttachmentKind,
  ChatMessage,
  Consultation,
  ConsultationChannel,
} from "../types/consultation";
import { openStatuses } from "../types/consultation";
import type { Child, User, UserRole } from "../types/user";
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

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  specialty?: string;
  licenseNumber?: string;
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

  // --- pedidos ------------------------------------------------------------
  createConsultation: (
    input: CreateConsultationInput,
  ) => ActionResult<{ consultation: Consultation; message: string; isEmergency: boolean }>;
  scheduleConsultation: (id: string, input: ScheduleInput) => ActionResult<Consultation>;
  startConsultation: (id: string, doctorId: string) => ActionResult<Consultation>;
  completeConsultation: (
    id: string,
    payload: { clinicalNotes: string; guidance: string },
  ) => ActionResult<Consultation>;
  referConsultation: (id: string, reason: string) => ActionResult<Consultation>;
  cancelConsultation: (id: string) => ActionResult<undefined>;
  resendMeetingLink: (id: string) => ActionResult<Consultation>;
  sendMessage: (
    id: string,
    message: Omit<ChatMessage, "id" | "sentAt">,
  ) => ActionResult<Consultation>;
  addAttachment: (
    id: string,
    attachment: { name: string; kind: AttachmentKind },
  ) => ActionResult<Consultation>;

  // --- administração ------------------------------------------------------
  createUser: (input: CreateUserInput) => ActionResult<User>;
  updateUser: (userId: string, patch: Partial<User>) => ActionResult<User>;
  setUserActive: (userId: string, active: boolean) => ActionResult<User>;

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

        if (!user) return fail("Não existe nenhuma conta com este email.");
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
        if (get().users.some((user) => normalizeEmail(user.email) === email)) {
          return fail("Já existe uma conta registada com este email.");
        }

        const now = new Date().toISOString();
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

        if (patch.email) {
          const email = normalizeEmail(patch.email);
          const taken = get().users.some(
            (item) => item.id !== userId && normalizeEmail(item.email) === email,
          );
          if (taken) return fail("Esse email já está associado a outra conta.");
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

      removeChild: (childId) => {
        const hasOpenRequest = get().consultations.some(
          (item) => item.childId === childId && openStatuses.includes(item.status),
        );
        if (hasOpenRequest) {
          return fail("Não é possível remover: existe um pedido em aberto para esta criança.");
        }

        set((state) => ({
          children: state.children.filter((item) => item.id !== childId),
        }));

        return { ok: true, data: undefined };
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
            item.childId === "" &&
            item.phone === input.phone.trim() &&
            item.childName.toLowerCase() === childName.trim().toLowerCase()
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

        const guardian = input.guardianId
          ? state.users.find((item) => item.id === input.guardianId)
          : undefined;

        const reference = `R-${state.nextReference}`;
        const now = new Date().toISOString();

        const consultation: Consultation = {
          id: makeId("TC"),
          reference,
          childId: child?.id ?? "",
          childName: childName.trim(),
          childAgeYears: childAge,
          guardianId: guardian?.id ?? null,
          guardianName: guardian?.name ?? input.fallbackGuardianName ?? "Encarregado",
          phone: input.phone.trim() || (guardian?.phone ?? ""),
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
          closedAt: result.isEmergency ? now : null,
        };

        set((current) => ({
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
        if (new Date(input.scheduledAt).getFullYear() < 2026) {
          return fail("A teleconsulta só pode ser agendada a partir de 2026.");
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

        const updated: Consultation = {
          ...consultation,
          status: "CONCLUIDA",
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

      referConsultation: (id, reason) => {
        const consultation = get().consultations.find((item) => item.id === id);
        if (!consultation) return fail("Pedido não encontrado.");
        if (!reason.trim()) return fail("Indique o motivo do encaminhamento.");

        const updated: Consultation = {
          ...consultation,
          status: "ENCAMINHADA",
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

        const updated: Consultation = {
          ...consultation,
          meetingLink: buildMeetingLink(consultation.reference),
          meetingLinkExpiresAt: new Date(
            new Date(consultation.scheduledAt).getTime() +
              MEETING_LINK_GRACE_MINUTES * 60_000,
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

      // --- administração --------------------------------------------------
      createUser: (input) => {
        const email = normalizeEmail(input.email);

        if (!input.name.trim()) return fail("Indique o nome do utilizador.");
        if (!email) return fail("Indique um email válido.");
        if (input.password.length < 6) {
          return fail("A palavra-passe deve ter pelo menos 6 caracteres.");
        }
        if (get().users.some((user) => normalizeEmail(user.email) === email)) {
          return fail("Já existe um utilizador com este email.");
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
      version: 2,
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

  return edits;
}

export { DEMO_PASSWORD };

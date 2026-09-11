"use client";

import { useMemo } from "react";

import { useClinicStore } from "./clinic-store";
import type { Availability } from "../types/availability";
import type { Child, User } from "../types/user";

export function useCurrentUser(): User | null {
  return useClinicStore((state) => {
    if (!state.sessionUserId) return null;
    return state.users.find((user) => user.id === state.sessionUserId) ?? null;
  });
}

export function useUsers() {
  return useClinicStore((state) => state.users);
}

/**
 * Filtrar dentro do selector devolveria um array novo em cada render e o
 * zustand entraria em ciclo infinito. Selecciona-se a lista estável e o
 * filtro corre em `useMemo`.
 */
export function usePediatricians() {
  const users = useClinicStore((state) => state.users);

  return useMemo(
    () => users.filter((user) => user.role === "PEDIATRA" && user.state === "ACTIVA"),
    [users],
  );
}

export function useTriageTeam() {
  const users = useClinicStore((state) => state.users);

  return useMemo(
    () => users.filter((user) => user.role === "TRIAGEM" && user.state === "ACTIVA"),
    [users],
  );
}

export function useConsultations() {
  return useClinicStore((state) => state.consultations);
}

export function useChildren() {
  return useClinicStore((state) => state.children);
}

export function useAvailability() {
  return useClinicStore((state) => state.availability);
}

/** Disponibilidades de um pediatra, em ordem cronológica. */
export function useDoctorAvailability(doctorId: string) {
  const availability = useClinicStore((state) => state.availability);

  return useMemo(
    () =>
      availability
        .filter((entry) => entry.doctorId === doctorId)
        .sort(compareAvailability),
    [availability, doctorId],
  );
}

export function compareAvailability(a: Availability, b: Availability) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.startTime.localeCompare(b.startTime);
}

/** Notificações de um utilizador, das mais recentes para as mais antigas. */
export function useNotifications(userId: string) {
  const notifications = useClinicStore((state) => state.notifications);

  return useMemo(
    () =>
      notifications
        .filter((item) => item.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notifications, userId],
  );
}

export function useUnreadNotificationCount(userId: string) {
  return useClinicStore(
    (state) =>
      state.notifications.filter(
        (item) => item.userId === userId && !item.readAt,
      ).length,
  );
}

/** Crianças de um encarregado específico. */
export function childrenOfGuardian(children: Child[], guardianId: string) {
  return children.filter((child) => child.guardianId === guardianId);
}

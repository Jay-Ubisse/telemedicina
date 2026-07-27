"use client";

import { useMemo } from "react";

import { useClinicStore } from "./clinic-store";
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
    () => users.filter((user) => user.role === "PEDIATRA" && user.active),
    [users],
  );
}

export function useConsultations() {
  return useClinicStore((state) => state.consultations);
}

export function useChildren() {
  return useClinicStore((state) => state.children);
}

/** Crianças de um encarregado específico. */
export function childrenOfGuardian(children: Child[], guardianId: string) {
  return children.filter((child) => child.guardianId === guardianId);
}

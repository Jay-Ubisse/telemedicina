"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialTeleconsultations } from "../data/teleconsultations";
import type { Teleconsultation } from "../types/teleconsultation";

type CreateTeleconsultationInput = Omit<Teleconsultation, "id" | "createdAt">;

type TelemedicineStore = {
  teleconsultations: Teleconsultation[];
  addTeleconsultation: (payload: CreateTeleconsultationInput) => void;
  updateConsultationStatus: (
    id: string,
    status: Teleconsultation["status"],
  ) => void;
  clearAll: () => void;
};

export const useTelemedicineStore = create<TelemedicineStore>()(
  persist(
    (set) => ({
      teleconsultations: initialTeleconsultations,

      addTeleconsultation: (payload) =>
        set((state) => ({
          teleconsultations: [
            {
              ...payload,
              id: `TC-${String(state.teleconsultations.length + 1).padStart(3, "0")}`,
              createdAt: new Date().toISOString(),
            },
            ...state.teleconsultations,
          ],
        })),

      updateConsultationStatus: (id, status) =>
        set((state) => ({
          teleconsultations: state.teleconsultations.map((item) =>
            item.id === id ? { ...item, status } : item,
          ),
        })),

      clearAll: () => set({ teleconsultations: [] }),
    }),
    {
      name: "telemedicine-demo-store",
    },
  ),
);

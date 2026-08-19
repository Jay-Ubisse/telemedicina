"use client";

import { useEffect } from "react";

import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useClinicStore } from "@/lib/store/clinic-store";

/**
 * Realinha os dados de demonstração ao dia actual assim que o browser hidrata.
 *
 * Antes isto só corria dentro da área autenticada, pelo que o simulador USSD e
 * a página pública mostravam as datas do ficheiro de sementes ("24 a 28 de
 * Julho"). Montado na raiz, qualquer ecrã — público ou privado — apresenta
 * sempre pedidos das últimas horas.
 */
export function DemoSync() {
  const hydrated = useHydrated();
  const syncDemoDay = useClinicStore((state) => state.syncDemoDay);

  useEffect(() => {
    if (hydrated) syncDemoDay();
  }, [hydrated, syncDemoDay]);

  return null;
}

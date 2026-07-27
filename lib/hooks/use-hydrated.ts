"use client";

import { useSyncExternalStore } from "react";

/** A hidratação nunca "muda", por isso a subscrição é um no-op. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * O estado vive em localStorage, por isso o primeiro render do cliente tem de
 * ser igual ao do servidor. Este hook devolve `false` nesse render e `true`
 * depois, evitando erros de hidratação nas páginas que lêem a store.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

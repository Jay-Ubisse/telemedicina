"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { User } from "@/lib/types/user";

const SessionContext = createContext<User | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

/**
 * O layout protegido já garante que existe sessão, por isso as páginas podem
 * contar sempre com um utilizador.
 */
export function useSession(): User {
  const user = useContext(SessionContext);

  if (!user) {
    throw new Error("useSession tem de ser usado dentro de <SessionProvider>.");
  }

  return user;
}

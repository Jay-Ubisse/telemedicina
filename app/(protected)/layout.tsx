"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/layout/session-provider";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useCurrentUser } from "@/lib/store/selectors";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const syncDemoDay = useClinicStore((state) => state.syncDemoDay);

  // Realinha os dados de demonstração ao dia actual, para que a agenda de hoje
  // tenha sempre conteúdo relevante.
  useEffect(() => {
    if (hydrated) syncDemoDay();
  }, [hydrated, syncDemoDay]);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">A preparar o seu painel…</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider user={user}>
      <div className="min-h-screen bg-muted/30">
        <AppSidebar user={user} />
        <div className="min-h-screen lg:pl-64">
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}

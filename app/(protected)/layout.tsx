"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/layout/session-provider";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { canAccessRoute } from "@/lib/auth/access";
import { useCurrentUser } from "@/lib/store/selectors";
import { roleLabels } from "@/lib/types/user";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useCurrentUser();

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

  // Controlo de acesso por perfil também nas rotas: esconder o item de menu
  // não chega, porque o URL continua a ser escrito à mão.
  const allowed = canAccessRoute(user.role, pathname);

  return (
    <SessionProvider user={user}>
      <div className="min-h-screen bg-muted/30">
        <AppSidebar user={user} />
        <div className="min-h-screen lg:pl-64">
          <main className="min-w-0">
            {allowed ? children : <Unauthorized role={roleLabels[user.role]} />}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

function Unauthorized({ role }: { role: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center ring-1 ring-foreground/8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
          <ShieldAlert className="size-6" />
        </span>

        <h1 className="mt-5 text-xl font-extrabold tracking-tight">
          Acesso não autorizado
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Esta área não faz parte do perfil <strong>{role}</strong>. Se precisa
          de aceder a estes dados, contacte a administração do HGM — os acessos
          fora do perfil ficam registados para auditoria.
        </p>

        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/inicio">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}

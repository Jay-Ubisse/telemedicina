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
import { useClinicStore } from "@/lib/store/clinic-store";
import { useCurrentUser } from "@/lib/store/selectors";
import { accountStateLabels, roleLabels } from "@/lib/types/user";
import { canSignIn } from "@/lib/types/user";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const logout = useClinicStore((state) => state.logout);

  /**
   * Sessão aberta não é passe vitalício: se a conta deixar de poder iniciar
   * sessão — foi desactivada, bloqueada ou voltou a provisória — a sessão é
   * encerrada de imediato. Era esta a falha do §12 do relatório, em que uma conta
   * marcada como inactiva continuava dentro da plataforma.
   */
  const blocked = Boolean(user) && !canSignIn(user!);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (blocked) logout();
  }, [hydrated, user, blocked, logout, router]);

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

  if (blocked) {
    return (
      <Blocked
        title="Esta conta não tem acesso à plataforma"
        description={`O estado actual da conta é «${accountStateLabels[user.state]}». Contas inactivas, bloqueadas ou provisórias não podem utilizar a plataforma. Contacte a administração do HGM.`}
      />
    );
  }

  // Controlo de acesso por perfil também nas rotas: esconder o item de menu não
  // chega, porque o URL continua a ser escrito à mão.
  const allowed = canAccessRoute(user.role, pathname);

  return (
    <SessionProvider user={user}>
      <div className="min-h-screen bg-muted/30">
        <AppSidebar user={user} />
        <div className="min-h-screen lg:pl-64">
          <main className="min-w-0">
            {allowed ? (
              children
            ) : (
              <Blocked
                title="Acesso não autorizado"
                description={`Esta área não faz parte do perfil ${roleLabels[user.role]}. Se precisa de aceder a estes dados, contacte a administração do HGM — os acessos fora do perfil ficam registados para auditoria.`}
              />
            )}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

function Blocked({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center ring-1 ring-foreground/8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
          <ShieldAlert className="size-6" />
        </span>

        <h1 className="mt-5 text-xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button asChild size="lg">
            <Link href="/inicio">Voltar ao início</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Entrar com outra conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

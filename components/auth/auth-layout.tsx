import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";

/**
 * Ecrã de autenticação: tela escura institucional com um único painel de papel
 * ao centro.
 *
 * O fundo já foi o menu USSD repetido em contraste muito baixo. Nos testes
 * lia-se como duas colunas de texto encavalitadas nas margens, por isso foi
 * substituído por um gradiente sóbrio.
 */
export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Faixa opcional abaixo do painel (ajuda, canal alternativo). */
  aside?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-ink text-ink-foreground">
      <Backdrop />

      <header className="relative z-10 border-b border-ink-line">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[86rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Logo href="/" tone="inverted" />

          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase transition-colors hover:text-ink-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="size-3" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-9 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="text-[0.625rem] tracking-[0.2em] text-primary font-semibold uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-[2.5rem] sm:leading-[1.05]">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl shadow-black/30 sm:p-7">
            {children}
          </div>

          {aside ? <div className="mt-5">{aside}</div> : null}
        </div>
      </main>

      <footer className="relative z-10 border-t border-ink-line">
        <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
            © 2026 Hospital Geral de Mavalane
          </p>
          <p className="text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
            Acesso por perfil · registo de auditoria
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Fundo institucional discreto: sem texto, sem ruído. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]" />
    </div>
  );
}

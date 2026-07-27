import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";

/**
 * Ecrã de autenticação: tela escura institucional com um único painel de papel
 * ao centro. A textura de fundo é o próprio menu USSD repetido — material do
 * produto em vez de decoração genérica.
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
      <UssdBackdrop />

      <header className="relative z-10 border-b border-ink-line">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[86rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Logo href="/" tone="inverted" />

          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm font-mono text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="size-3" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-9 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-primary uppercase">
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
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
            © 2026 Hospital Geral de Mavalane
          </p>
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
            Acesso por perfil · registo de auditoria
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Campo tipográfico de fundo com o diálogo USSD real, em contraste muito
 * baixo. Decorativo, por isso escondido dos leitores de ecrã.
 */
function UssdBackdrop() {
  const block = [
    "*123#",
    "HGM TelePediatria",
    "1. Solicitar teleconsulta",
    "2. Ver os meus pedidos",
    "3. Sair",
    "> 1",
    "Nome completo da criança:",
    "Idade da criança (0-15 anos):",
    "Localização (bairro e avenida):",
    "Sintoma principal:",
    "Canal de atendimento:",
    "1. Chamada de voz",
    "2. Videochamada",
    "Pedido registado.",
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-2 gap-16 p-10 font-mono text-[0.6875rem] leading-loose whitespace-pre text-ink-foreground/[0.028] select-none sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, column) => (
          <div key={column}>
            {block.map((line, index) => (
              <p key={`${column}-${index}`}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Vinheta: mantém o campo tipográfico como textura e não como ruído. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,var(--ink)_45%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--ink),transparent_22%,transparent_78%,var(--ink))]" />
    </div>
  );
}

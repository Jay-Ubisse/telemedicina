import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { EMERGENCY_NOTICE, INTEROPERABILITY_NOTE } from "@/lib/data/symptoms";

/**
 * Rodapé público.
 *
 * Saíram as ligações a áreas internas («Protocolo de triagem», «Para
 * profissionais»), o número de emergência que o protótipo não pode garantir e a
 * linha «FHIR R4 · HL7 v2 · WebRTC», que anunciava como implementado o que não
 * está. A interoperabilidade é agora descrita com a redacção aprovada no §5 do
 * relatório.
 */
const columns = [
  {
    title: "Plataforma",
    links: [
      { label: "Criar conta", href: "/registo" },
      { label: "Entrar", href: "/login" },
      { label: "Simulador USSD", href: "/ussd" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "/privacidade" },
      { label: "Termos", href: "/termos" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto w-full max-w-[86rem] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(2,1fr)]">
          <div>
            <Logo href="/" tone="inverted" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted">
              Plataforma de telepediatria do Hospital Geral de Mavalane, na
              cidade de Maputo.
            </p>
            <p className="mt-5 max-w-sm text-xs leading-relaxed text-ink-muted">
              {EMERGENCY_NOTICE}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[0.625rem] tracking-[0.16em] text-ink-muted font-semibold uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-foreground/80 transition-colors hover:text-ink-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-line pt-6">
          <p className="text-xs text-ink-muted">
            © 2026 Hospital Geral de Mavalane. Protótipo académico de
            demonstração.
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
            {INTEROPERABILITY_NOTE}
          </p>
        </div>
      </div>
    </footer>
  );
}

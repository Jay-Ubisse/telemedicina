import Link from "next/link";

import { Logo } from "@/components/brand/logo";

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
    title: "Instituição",
    links: [
      { label: "Hospital Geral de Mavalane", href: "#servico" },
      { label: "Protocolo de triagem", href: "#triagem" },
      { label: "Para profissionais", href: "#profissionais" },
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
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo href="/" tone="inverted" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              Teleconsulta pediátrica para famílias da cidade de Maputo.
              Funciona em qualquer telemóvel, com ou sem internet.
            </p>

            <p className="mt-6 text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
              Emergência pediátrica
            </p>
            <p className="mt-1 text-lg font-semibold">1420</p>
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

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © 2026 Hospital Geral de Mavalane. Protótipo institucional.
          </p>
          <p className="text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
            FHIR R4 · HL7 v2 · WebRTC
          </p>
        </div>
      </div>
    </footer>
  );
}

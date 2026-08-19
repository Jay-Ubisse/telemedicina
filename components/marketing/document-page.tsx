import type { ReactNode } from "react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export type DocumentSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

/**
 * Página institucional de texto corrido (privacidade, termos, contacto).
 * Mesma grelha e mesma tipografia da página inicial — muda só o conteúdo.
 */
export function DocumentPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt?: string;
  sections: DocumentSection[];
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-paper">
          <div className="mx-auto w-full max-w-[86rem] px-5 pt-14 pb-12 sm:px-8 lg:pt-20 lg:pb-16">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8 bg-primary" />
              <p className="text-[0.6875rem] tracking-[0.2em] text-primary font-semibold uppercase">
                {eyebrow}
              </p>
            </div>

            <h1 className="mt-6 max-w-3xl font-heading text-[2.25rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {intro}
            </p>

            {updatedAt ? (
              <p className="mt-6 text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
                Última actualização · {updatedAt}
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-[86rem] px-5 py-12 sm:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,44rem)] lg:gap-16">
              <nav aria-label="Índice" className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
                  Nesta página
                </p>
                <ol className="mt-4 space-y-2.5 border-l border-border pl-4">
                  {sections.map((section) => (
                    <li key={section.heading}>
                      <a
                        href={`#${slugify(section.heading)}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div>
                {sections.map((section) => (
                  <section
                    key={section.heading}
                    id={slugify(section.heading)}
                    className="scroll-mt-24 border-b border-border py-7 first:pt-0 last:border-0"
                  >
                    <h2 className="font-heading text-xl font-bold tracking-[-0.02em]">
                      {section.heading}
                    </h2>

                    {section.paragraphs?.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="mt-3.5 leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets ? (
                      <ul className="mt-4 space-y-2.5">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                          >
                            <span
                              aria-hidden
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}

                {children}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

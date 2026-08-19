"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Serviço", href: "#servico" },
  { label: "Triagem", href: "#triagem" },
  { label: "Percurso", href: "#percurso" },
  { label: "Profissionais", href: "#profissionais" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Faixa institucional: o canal offline é a informação mais útil que
          esta página pode dar a quem chega de um telemóvel simples. */}
      <div className="bg-ink text-ink-foreground">
        <div className="mx-auto flex w-full max-w-[86rem] items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <p className="text-[0.625rem] tracking-[0.14em] font-semibold uppercase">
            Sem internet? Marque{" "}
            <span className="font-ussd font-semibold text-primary">*123#</span>
          </p>
          <p className="hidden text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase sm:block">
            Hospital Geral de Mavalane · Maputo
          </p>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-200",
          scrolled
            ? "border-border bg-background/90 backdrop-blur-md"
            : "border-border/60 bg-background",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[86rem] items-center gap-10 px-5 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[0.6875rem] tracking-[0.12em] text-muted-foreground font-semibold uppercase transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>

            <Button asChild size="lg" className="rounded-lg">
              <Link href="/registo">Criar conta</Link>
            </Button>

            <Button
              variant="outline"
              size="icon-lg"
              className="md:hidden"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="mx-auto flex w-full max-w-[86rem] flex-col px-5 py-1 sm:px-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3.5 text-[0.6875rem] tracking-[0.12em] text-muted-foreground font-semibold uppercase last:border-0 hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="border-t border-border py-3.5 text-[0.6875rem] tracking-[0.12em] text-primary font-semibold uppercase sm:hidden"
              >
                Entrar
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}

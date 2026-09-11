"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho público.
 *
 * O relatório limita-o ao essencial: identificação, Início, Como funciona,
 * Simulador USSD, Entrar e Criar conta. Saíram as referências a triagem,
 * profissionais e relatórios — áreas internas que não pertencem a uma página
 * pública — e a faixa que anunciava o código `*123#` como se fosse um serviço
 * em funcionamento.
 *
 * As ligações são absolutas (`/#como-funciona`) para funcionarem também nas
 * páginas institucionais, que partilham este cabeçalho.
 */
const navItems = [
  { label: "Início", href: "/" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Simulador USSD", href: "/ussd" },
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

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3.5 text-sm font-medium text-muted-foreground last:border-0 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="border-t border-border py-3.5 text-sm font-semibold text-primary sm:hidden"
            >
              Entrar
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

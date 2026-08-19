import type { Metadata, Viewport } from "next";
import { Nunito, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoSync } from "@/components/layout/demo-sync";
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Títulos em Nunito: terminações arredondadas e formas abertas, mais próximas
 * de uma família com crianças do que a grotesca anterior, sem perder o registo
 * institucional de um hospital.
 */
const heading = Nunito({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

/**
 * Monoespaçada reservada exclusivamente à demonstração USSD — o ecrã do
 * telemóvel, o simulador e o código `*123#`. Fora daí, a plataforma fala com a
 * voz da tipografia de texto.
 */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-ussd",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HGM TelePediatria — Cuidado pediátrico à distância",
    template: "%s — HGM TelePediatria",
  },
  description:
    "Plataforma de teleconsulta pediátrica do Hospital Geral de Mavalane. Solicite teleconsultas, envie sintomas e exames, e receba orientação clínica sem sair de casa.",
};

export const viewport: Viewport = {
  themeColor: "#0b6bb5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ" suppressHydrationWarning>
      <body
        className={cn(
          sans.variable,
          heading.variable,
          mono.variable,
          "font-sans antialiased",
        )}
      >
        <DemoSync />
        {children}
      </body>
    </html>
  );
}

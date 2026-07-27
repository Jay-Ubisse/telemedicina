import type { Metadata, Viewport } from "next";
import { Archivo, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Grotesca institucional usada nos títulos do site público. */
const heading = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
        {children}
      </body>
    </html>
  );
}

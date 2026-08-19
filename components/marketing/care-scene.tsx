import { Mic, PhoneOff, Video } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cena de abertura da página inicial: uma teleconsulta a acontecer.
 *
 * O relatório de testes pedia que a primeira área comunicasse imediatamente o
 * conceito — uma família, uma criança e um pediatra em videochamada. Como o
 * protótipo não usa fotografias de pessoas reais (nem seria adequado numa
 * plataforma de saúde pediátrica), a cena é desenhada em vector: a moldura da
 * chamada, o pediatra do HGM do outro lado e, na auto-visualização, o
 * encarregado com a criança ao colo.
 */
export function CareScene({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-ink shadow-xl shadow-ink/15">
        {/* Barra da chamada */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-line px-4 py-2.5">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-success" />
            <span className="text-[0.625rem] tracking-[0.16em] text-ink-muted font-semibold uppercase">
              Teleconsulta em curso
            </span>
          </span>
          <span className="text-[0.625rem] font-semibold text-ink-foreground tabular-nums">
            08:24
          </span>
        </div>

        {/* Palco */}
        <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_50%_28%,oklch(38%_0.06_245),oklch(17%_0.02_245))]">
          <Pediatrician className="absolute inset-0 h-full w-full" />

          <figcaption className="absolute bottom-3 left-3 rounded-lg bg-black/45 px-2.5 py-1.5 backdrop-blur">
            <p className="text-xs font-semibold text-white">Dra. Sara Chissano</p>
            <p className="text-[0.5625rem] tracking-[0.14em] text-white/60 font-semibold uppercase">
              Pediatria Geral · HGM
            </p>
          </figcaption>

          {/* Auto-visualização: o encarregado com a criança */}
          <div className="absolute right-3 bottom-3 w-28 overflow-hidden rounded-xl bg-[oklch(26%_0.03_245)] ring-1 ring-white/15 sm:w-36">
            <div className="relative">
              <Family className="h-full w-full" />
              <p className="absolute bottom-1 left-2 text-[0.5rem] tracking-[0.12em] text-white/75 font-semibold uppercase">
                Em casa
              </p>
            </div>
          </div>
        </div>

        {/* Controlos */}
        <div className="flex items-center justify-center gap-2.5 border-t border-ink-line px-4 py-3">
          {[Mic, Video].map((Icon, index) => (
            <span
              key={index}
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-ink-foreground"
            >
              <Icon className="size-4" />
            </span>
          ))}
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-destructive text-white"
          >
            <PhoneOff className="size-4" />
          </span>
        </div>
      </div>

      {/* Etiqueta do canal offline, ancorada à moldura */}
      <div className="absolute -bottom-5 -left-3 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg shadow-ink/10 sm:-left-5">
        <p className="text-[0.5625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
          Sem internet
        </p>
        <p className="mt-0.5 font-ussd text-base font-bold text-primary">*123#</p>
      </div>
    </figure>
  );
}

/** Pediatra do HGM, de bata e estetoscópio, enquadrado como numa chamada. */
function Pediatrician({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 240"
      className={className}
      role="img"
      aria-label="Pediatra do Hospital Geral de Mavalane em videochamada"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Consultório: parede e prateleira */}
      <rect x="18" y="26" width="58" height="42" rx="4" fill="#ffffff" opacity="0.06" />
      <rect x="244" y="34" width="58" height="4" rx="2" fill="#ffffff" opacity="0.08" />
      <rect x="252" y="14" width="12" height="20" rx="2" fill="#ffffff" opacity="0.1" />
      <rect x="270" y="18" width="10" height="16" rx="2" fill="#ffffff" opacity="0.08" />

      {/* Ombros / bata */}
      <path
        d="M78 240c0-42 34-66 82-66s82 24 82 66Z"
        fill="#f4f7fb"
      />
      <path d="M160 174l-20 66h40Z" fill="#e3edf7" />
      <path d="M141 176c6 12 12 18 19 18s13-6 19-18l-19-8Z" fill="#0b6bb5" opacity="0.9" />

      {/* Pescoço e cabeça */}
      <rect x="146" y="150" width="28" height="30" rx="12" fill="#8d5524" />
      <ellipse cx="160" cy="120" rx="36" ry="40" fill="#a06a3c" />
      {/* Cabelo */}
      <path
        d="M124 116c0-24 16-40 36-40s36 16 36 40c0-6-10-14-36-14s-36 8-36 14Z"
        fill="#2a1a12"
      />
      <path d="M124 112c-6 16-2 30 4 36-4-18-2-30 6-40Z" fill="#2a1a12" />
      <path d="M196 112c6 16 2 30-4 36 4-18 2-30-6-40Z" fill="#2a1a12" />
      {/* Olhos e sorriso */}
      <ellipse cx="147" cy="122" rx="3.6" ry="4.2" fill="#1b1b1b" />
      <ellipse cx="173" cy="122" rx="3.6" ry="4.2" fill="#1b1b1b" />
      <path
        d="M148 138c4 6 20 6 24 0"
        stroke="#4a2c17"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Estetoscópio */}
      <path
        d="M138 182c-4 20 4 34 22 34s26-14 22-34"
        stroke="#0b6bb5"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="182" cy="220" r="8" fill="#0b6bb5" />
      <circle cx="182" cy="220" r="3.5" fill="#f4f7fb" />

      {/* Crachá do HGM */}
      <rect x="118" y="206" width="22" height="16" rx="3" fill="#0b6bb5" />
      <rect x="121" y="210" width="16" height="2.5" rx="1.25" fill="#ffffff" opacity="0.85" />
      <rect x="121" y="215" width="10" height="2.5" rx="1.25" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/** Encarregado com a criança ao colo, na auto-visualização da chamada. */
function Family({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      role="img"
      aria-label="Encarregado de educação com a criança ao colo"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="160" height="120" fill="oklch(30% 0.04 245)" />
      {/* Janela de casa */}
      <rect x="12" y="14" width="30" height="26" rx="3" fill="#ffffff" opacity="0.07" />

      {/* Adulto */}
      <path d="M52 120c0-26 16-40 38-40s38 14 38 40Z" fill="#1f6f4a" />
      <ellipse cx="90" cy="62" rx="21" ry="23" fill="#8d5524" />
      <path
        d="M69 58c0-14 9-24 21-24s21 10 21 24c0-5-8-9-21-9s-21 4-21 9Z"
        fill="#241209"
      />
      <ellipse cx="83" cy="64" rx="2.2" ry="2.6" fill="#1b1b1b" />
      <ellipse cx="97" cy="64" rx="2.2" ry="2.6" fill="#1b1b1b" />
      <path
        d="M84 73c3 4 9 4 12 0"
        stroke="#4a2c17"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Criança ao colo */}
      <path d="M28 120c0-18 10-28 24-28s24 10 24 28Z" fill="#f0a02c" />
      <ellipse cx="52" cy="84" rx="14" ry="15" fill="#a06a3c" />
      <path
        d="M38 81c0-9 6-16 14-16s14 7 14 16c0-3-6-6-14-6s-14 3-14 6Z"
        fill="#2a1a12"
      />
      <ellipse cx="47" cy="85" rx="1.8" ry="2.1" fill="#1b1b1b" />
      <ellipse cx="57" cy="85" rx="1.8" ry="2.1" fill="#1b1b1b" />
      <path
        d="M48 92c2 3 6 3 8 0"
        stroke="#4a2c17"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Braço do adulto a segurar a criança */}
      <path
        d="M76 104c-8 6-20 8-30 6"
        stroke="#8d5524"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

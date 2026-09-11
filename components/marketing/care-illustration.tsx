import { cn } from "@/lib/utils";

/**
 * Ilustração da primeira secção da página inicial.
 *
 * O relatório é específico: do lado direito deve estar «apenas uma imagem ou
 * ilustração simples de uma criança acompanhada pelo encarregado numa
 * teleconsulta pediátrica». Não há, por isso, moldura de videochamada, nem
 * controlos, nem dados clínicos — só a cena, desenhada em vector para não
 * recorrer a fotografias de pessoas reais numa plataforma de saúde pediátrica.
 */
export function CareIllustration({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <svg
        viewBox="0 0 520 420"
        className="h-auto w-full"
        role="img"
        aria-label="Encarregado de educação com uma criança ao colo durante uma teleconsulta pediátrica"
      >
        <defs>
          <linearGradient id="care-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary-soft)" />
            <stop offset="100%" stopColor="var(--accent-soft)" />
          </linearGradient>
          <clipPath id="care-clip">
            <rect x="20" y="20" width="480" height="380" rx="40" />
          </clipPath>
        </defs>

        {/* Fundo */}
        <rect
          x="20"
          y="20"
          width="480"
          height="380"
          rx="40"
          fill="url(#care-bg)"
        />

        <g clipPath="url(#care-clip)">
          {/* Sala de estar: sugerida por duas formas muito simples */}
          <circle cx="430" cy="110" r="52" fill="var(--card)" opacity="0.5" />
          <rect
            x="58"
            y="96"
            width="92"
            height="68"
            rx="12"
            fill="var(--card)"
            opacity="0.5"
          />

          {/* Sofá */}
          <rect
            x="64"
            y="292"
            width="392"
            height="108"
            rx="28"
            fill="var(--primary)"
            opacity="0.16"
          />

          {/* --- Encarregado de educação --- */}
          {/* Tronco */}
          <path
            d="M196 400c0-74 30-116 82-116s82 42 82 116Z"
            fill="var(--primary)"
          />
          {/* Pescoço */}
          <rect x="264" y="186" width="30" height="34" rx="14" fill="#9c6b3f" />
          {/* Cabeça */}
          <ellipse cx="279" cy="156" rx="44" ry="48" fill="#a87044" />
          {/* Cabelo */}
          <path
            d="M235 152c0-28 20-48 44-48s44 20 44 48c0-8-14-17-44-17s-44 9-44 17Z"
            fill="#2d1b12"
          />
          {/* Olhos e sorriso */}
          <ellipse cx="264" cy="158" rx="4" ry="4.8" fill="#22160f" />
          <ellipse cx="295" cy="158" rx="4" ry="4.8" fill="#22160f" />
          <path
            d="M265 176c5 7 23 7 28 0"
            stroke="#5c3a1f"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* --- Criança ao colo --- */}
          {/* Tronco */}
          <path
            d="M120 400c0-52 22-82 56-82s56 30 56 82Z"
            fill="var(--accent)"
          />
          {/* Cabeça */}
          <ellipse cx="176" cy="278" rx="33" ry="35" fill="#b07b4c" />
          {/* Cabelo */}
          <path
            d="M143 274c0-20 15-35 33-35s33 15 33 35c0-6-11-13-33-13s-33 7-33 13Z"
            fill="#32200f"
          />
          <ellipse cx="165" cy="280" rx="3.4" ry="4" fill="#22160f" />
          <ellipse cx="188" cy="280" rx="3.4" ry="4" fill="#22160f" />
          <path
            d="M166 293c4 5 16 5 20 0"
            stroke="#5c3a1f"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Braço do encarregado a segurar a criança */}
          <path
            d="M232 330c-20 14-44 18-66 15"
            stroke="#a87044"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
          />

          {/* --- Telemóvel com que a família fala com o hospital --- */}
          <g transform="rotate(-8 360 286)">
            <rect
              x="332"
              y="240"
              width="62"
              height="104"
              rx="12"
              fill="var(--ink)"
            />
            <rect
              x="338"
              y="250"
              width="50"
              height="84"
              rx="7"
              fill="var(--card)"
            />
            {/* Símbolo de cuidado — não é um ecrã de chamada */}
            <path
              d="M363 298c-9-7-14-12-14-18a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 6-5 11-14 18Z"
              fill="var(--primary)"
            />
            <rect
              x="348"
              y="308"
              width="30"
              height="4"
              rx="2"
              fill="var(--primary)"
              opacity="0.35"
            />
            <rect
              x="353"
              y="317"
              width="20"
              height="4"
              rx="2"
              fill="var(--primary)"
              opacity="0.22"
            />
          </g>

          {/* Mão do encarregado a segurar o telemóvel */}
          <path
            d="M330 352c14 6 28 4 38-6"
            stroke="#a87044"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </figure>
  );
}

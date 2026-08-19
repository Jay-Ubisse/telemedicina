"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Sessão USSD encenada. É o elemento de assinatura da página: em vez de
 * descrever o produto, mostra o mecanismo real — um pedido feito num telemóvel
 * sem internet, que sai do outro lado já triado.
 *
 * Os dados são fictícios e, ainda assim, apresentados anonimizados: número
 * parcialmente ocultado, criança identificada por iniciais e localização
 * limitada ao bairro. Numa plataforma de saúde pediátrica, a demonstração
 * pública tem de reflectir as mesmas regras de confidencialidade do produto.
 */
type Line =
  | { kind: "out"; text: string }
  | { kind: "in"; text: string }
  | { kind: "rule" };

const script: Line[] = [
  { kind: "out", text: "HGM TelePediatria\nNúmero detectado: +258 84 *** 3390" },
  { kind: "out", text: "1. Solicitar teleconsulta\n2. Ver os meus pedidos\n3. Sair" },
  { kind: "in", text: "1" },
  { kind: "rule" },
  { kind: "out", text: "Nome completo da criança:" },
  { kind: "in", text: "T. M." },
  { kind: "out", text: "Idade da criança (0-15 anos):" },
  { kind: "in", text: "4" },
  { kind: "out", text: "Bairro (cidade de Maputo):\n3. Hulene A\n4. Hulene B\n99. Mais opções" },
  { kind: "in", text: "4" },
  { kind: "out", text: "Sintoma principal:\n7. Febre alta\n8. Dor abdominal forte\n99. Mais opções" },
  { kind: "in", text: "7" },
  { kind: "out", text: "Canal de atendimento:\n1. Chamada de voz\n2. Videochamada" },
  { kind: "in", text: "2" },
  { kind: "rule" },
  {
    kind: "out",
    text: "Pedido registado como urgente.\nReferência R-1042 · Prioridade URGENTE\nA equipa do HGM vai contactá-lo.",
  },
];

const TYPE_MS = 55;
const OUT_MS = 620;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getMotionSnapshot = () => window.matchMedia(MOTION_QUERY).matches;
const getMotionServerSnapshot = () => false;

export function UssdTerminal({ className }: { className?: string }) {
  const [rawStep, setStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [runId, setRunId] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reduced = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot,
  );

  // Quem prefere menos movimento vê a sessão já completa, sem animação.
  const step = reduced ? script.length : rawStep;

  useEffect(() => {
    if (reduced || step >= script.length) return;

    const line = script[step];

    if (line.kind === "in" && typed < line.text.length) {
      const timer = window.setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      return () => window.clearTimeout(timer);
    }

    const delay = line.kind === "in" ? 420 : line.kind === "rule" ? 180 : OUT_MS;
    const timer = window.setTimeout(() => {
      setStep((n) => n + 1);
      setTyped(0);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [step, typed, reduced, runId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [step, typed]);

  const finished = step >= script.length;
  const visible = useMemo(() => script.slice(0, Math.min(step + 1, script.length)), [step]);

  function replay() {
    setStep(0);
    setTyped(0);
    setRunId((n) => n + 1);
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-ink text-ink-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-line px-4 py-2.5">
        <span className="font-ussd text-[0.625rem] tracking-[0.18em] text-ink-muted uppercase">
          Ecrã do telemóvel
        </span>
        <span className="font-ussd text-[0.625rem] font-semibold tracking-[0.12em] text-primary-foreground uppercase">
          <span className="rounded-sm bg-primary px-1.5 py-0.5">*123#</span>
        </span>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="h-80 overflow-y-auto px-4 py-4 font-ussd text-[0.8125rem] leading-[1.65] sm:h-96"
      >
        {visible.map((line, index) => {
          const isCurrent = index === step;

          if (line.kind === "rule") {
            return (
              <hr
                key={`rule-${runId}-${index}`}
                className="my-3 border-ink-line"
              />
            );
          }

          if (line.kind === "out") {
            return (
              <p
                key={`out-${runId}-${index}`}
                className="mb-3 whitespace-pre-line text-ink-foreground/90"
              >
                {line.text}
              </p>
            );
          }

          const shown =
            reduced || !isCurrent ? line.text : line.text.slice(0, typed);

          return (
            <p
              key={`in-${runId}-${index}`}
              className="mb-3 flex gap-2 text-primary"
            >
              <span aria-hidden className="shrink-0 select-none text-ink-muted">
                &gt;
              </span>
              <span>
                {shown}
                {isCurrent && !reduced && !finished ? (
                  <span
                    aria-hidden
                    className="ml-px inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-primary"
                  />
                ) : null}
              </span>
            </p>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-line px-4 py-2.5">
        <span className="font-ussd text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
          {finished ? "Sessão terminada" : "Sessão activa"}
        </span>

        {reduced ? null : (
          <button
            type="button"
            onClick={replay}
            className="flex items-center gap-1.5 rounded-sm font-ussd text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <RotateCcw className="size-3" />
            Repetir
          </button>
        )}
      </div>
    </div>
  );
}

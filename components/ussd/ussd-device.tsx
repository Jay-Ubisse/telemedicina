"use client";

import type { ReactNode } from "react";
import { Signal, Wifi, BatteryMedium } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Moldura de um telemóvel simples, para o simulador se parecer com a
 * experiência real de um menu USSD.
 */
export function UssdDevice({
  carrier,
  children,
  footer,
}: {
  carrier: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-[2.25rem] bg-gradient-to-b from-[oklch(32%_0.02_245)] to-[oklch(20%_0.02_245)] p-3 shadow-[0_30px_70px_-35px_oklch(25%_0.05_245_/_0.7)] ring-1 ring-black/20">
        <div className="overflow-hidden rounded-[1.6rem] bg-background">
          {/* Barra de estado */}
          <div className="flex items-center justify-between bg-foreground/90 px-4 py-2 text-[0.625rem] font-medium text-background">
            <span className="flex items-center gap-1.5">
              <Signal className="size-3" />
              {carrier}
            </span>
            <span className="flex items-center gap-2">
              <Wifi className="size-3" />
              <BatteryMedium className="size-3.5" />
            </span>
          </div>

          <div className="flex min-h-[30rem] flex-col">{children}</div>
        </div>

        {footer ? <div className="px-1 pt-3 pb-1">{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * Caixa de diálogo USSD: texto monoespaçado sobre fundo claro, exactamente
 * como aparece num telemóvel.
 */
export function UssdDialog({
  code,
  children,
  tone = "default",
}: {
  code: string;
  children: ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="flex-1 px-4 py-4">
      <div
        className={cn(
          "rounded-xl border p-4 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-line",
          tone === "danger"
            ? "border-destructive/30 bg-destructive/8 text-destructive"
            : tone === "success"
              ? "border-success/30 bg-success/10 text-foreground"
              : "border-border bg-muted/60 text-foreground",
        )}
      >
        <p className="mb-2 text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
          {code}
        </p>
        {children}
      </div>
    </div>
  );
}

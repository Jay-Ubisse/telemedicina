import Link from "next/link";
import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string | null;
  className?: string;
  /** Esconde o texto e deixa apenas a marca. */
  compact?: boolean;
  tone?: "default" | "inverted";
};

export function Logo({
  href = "/",
  className,
  compact = false,
  tone = "default",
}: LogoProps) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm",
          tone === "inverted"
            ? "bg-white/15 text-white ring-1 ring-white/25"
            : "bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--accent),var(--primary)_45%)] text-primary-foreground",
        )}
      >
        <Activity className="size-4.5" strokeWidth={2.5} />
      </span>

      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-sm font-extrabold tracking-tight",
              tone === "inverted" ? "text-white" : "text-foreground",
            )}
          >
            HGM
          </span>
          <span
            className={cn(
              "mt-0.5 text-[0.625rem] font-semibold tracking-[0.18em] uppercase",
              tone === "inverted" ? "text-white/70" : "text-primary",
            )}
          >
            TelePediatria
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {content}
    </Link>
  );
}

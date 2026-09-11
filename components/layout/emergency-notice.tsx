import { AlertTriangle } from "lucide-react";

import { EMERGENCY_NOTICE } from "@/lib/data/symptoms";
import { cn } from "@/lib/utils";

/**
 * Aviso de emergência com a redacção aprovada no relatório (§5). Existe num só
 * componente para que o texto seja literalmente o mesmo em toda a plataforma.
 */
export function EmergencyNotice({
  className,
  tone = "default",
}: {
  className?: string;
  /** `inverted` para superfícies escuras. */
  tone?: "default" | "inverted";
}) {
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-xl px-4 py-3.5",
        tone === "inverted"
          ? "bg-white/8 text-ink-foreground ring-1 ring-white/15"
          : "bg-destructive/8 text-foreground ring-1 ring-destructive/20",
        className,
      )}
    >
      <AlertTriangle
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "inverted" ? "text-warning" : "text-destructive",
        )}
      />
      <p className="text-sm leading-relaxed">{EMERGENCY_NOTICE}</p>
    </aside>
  );
}

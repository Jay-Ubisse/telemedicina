import { cn } from "@/lib/utils";

export type BreakdownItem = {
  key: string;
  label: string;
  total: number;
  colorClassName: string;
};

/** Lista de barras horizontais para distribuições categóricas (prioridade, canal, ...). */
export function BreakdownBars({ items }: { items: BreakdownItem[] }) {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {item.label}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {item.total}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-sm bg-muted">
            <div
              className={cn("h-full rounded-r-sm transition-all", item.colorClassName)}
              style={{
                width: `${Math.max((item.total / max) * 100, item.total > 0 ? 3 : 0)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

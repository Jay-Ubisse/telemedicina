import type { ReactNode } from "react";

export function UssdScreen({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="border-b bg-black px-5 py-4 text-green-400">
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-green-300/80">{description}</p>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 px-5 py-5">{children}</div>
    </div>
  );
}

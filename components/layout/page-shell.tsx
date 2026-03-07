import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
      {children}
    </div>
  );
}

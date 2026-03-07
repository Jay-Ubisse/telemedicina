import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />

      <div className="min-h-screen lg:pl-72">
        <main className="min-h-screen min-w-0">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Smartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Teleconsultas",
    href: "/teleconsultas",
    icon: Stethoscope,
  },
  {
    title: "Histórico Clínico",
    href: "/historico-clinico",
    icon: ClipboardList,
  },
  {
    title: "Perfil",
    href: "/perfil",
    icon: UserRound,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-72 border-r bg-background lg:flex lg:flex-col">
      <div className="border-b px-6 py-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            Telemedicina Demo
          </h2>
          <p className="text-sm text-muted-foreground">
            Painel de controlo médico
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Sair</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

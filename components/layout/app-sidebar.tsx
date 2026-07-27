"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Smartphone } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { navItemsForRole } from "@/components/layout/nav-items";
import type { User } from "@/lib/types/user";
import { roleLabels } from "@/lib/types/user";
import { cn } from "@/lib/utils";

export function SidebarContent({
  user,
  onNavigate,
}: {
  user: User;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(user.role);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-5 py-5">
        <Logo href="/inicio" />
      </div>

      <div className="px-5 pb-4">
        <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {roleLabels[user.role]}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        <Link
          href="/ussd"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
        >
          <Smartphone className="size-4 shrink-0" />
          Simulador USSD
        </Link>

        <div className="rounded-xl bg-primary-soft p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-secondary-foreground">
            <LifeBuoy className="size-3.5 text-primary" />
            Apoio HGM
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Emergência pediátrica? Ligue{" "}
            <span className="font-semibold text-foreground">1420</span> ou dirija-se
            à unidade sanitária mais próxima.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({ user }: { user: User }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}

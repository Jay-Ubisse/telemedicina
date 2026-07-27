"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, UserRound } from "lucide-react";

import { SidebarContent } from "@/components/layout/app-sidebar";
import { initialsOf } from "@/components/layout/nav-items";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { User } from "@/lib/types/user";
import { roleLabels } from "@/lib/types/user";
import { useState } from "react";

type AppHeaderProps = {
  user: User;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AppHeader({ user, title, subtitle, actions }: AppHeaderProps) {
  const router = useRouter();
  const logout = useClinicStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              className="lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <SidebarContent user={user} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Abrir menu do utilizador"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">
                    {initialsOf(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[10rem] truncate text-sm font-semibold">
                    {user.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {roleLabels[user.role]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-semibold">{user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil">
                  <UserRound />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                <LogOut />
                Terminar sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

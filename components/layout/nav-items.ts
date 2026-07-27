import {
  Baby,
  ClipboardList,
  FileHeart,
  Home,
  Settings2,
  Stethoscope,
  UserRound,
} from "lucide-react";

import type { UserRole } from "@/lib/types/user";

export type NavItem = {
  title: string;
  href: string;
  icon: typeof Home;
  roles: UserRole[];
  description: string;
};

/** "Início" e não "Dashboard" — pedido explícito nas observações do protótipo. */
export const navItems: NavItem[] = [
  {
    title: "Início",
    href: "/inicio",
    icon: Home,
    roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"],
    description: "Visão geral do dia",
  },
  {
    title: "Teleconsultas",
    href: "/teleconsultas",
    icon: Stethoscope,
    roles: ["PEDIATRA", "ADMIN"],
    description: "Fila de triagem e agenda",
  },
  {
    title: "Os meus pedidos",
    href: "/teleconsultas",
    icon: ClipboardList,
    roles: ["ENCARREGADO"],
    description: "Pedidos submetidos",
  },
  {
    title: "Crianças",
    href: "/criancas",
    icon: Baby,
    roles: ["ENCARREGADO"],
    description: "Educandos registados",
  },
  {
    title: "Histórico clínico",
    href: "/historico-clinico",
    icon: FileHeart,
    roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"],
    description: "Consultas encerradas",
  },
  {
    title: "Administração",
    href: "/administracao",
    icon: Settings2,
    roles: ["ADMIN"],
    description: "Utilizadores e relatórios",
  },
  {
    title: "Perfil",
    href: "/perfil",
    icon: UserRound,
    roles: ["ENCARREGADO", "PEDIATRA", "ADMIN"],
    description: "Os seus dados",
  },
];

export function navItemsForRole(role: UserRole) {
  return navItems.filter((item) => item.roles.includes(role));
}

export function initialsOf(name: string) {
  return name
    .replace(/^(Dr|Dra)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

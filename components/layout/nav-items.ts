import {
  Baby,
  Bell,
  CalendarClock,
  ClipboardCheck,
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

/**
 * Menu por perfil. Cada utilizador vê apenas as funções autorizadas (§1) — e o
 * controlo é reforçado ao nível da rota em `lib/auth/access.ts`, porque esconder
 * o item de menu não impede escrever o URL à mão.
 *
 * "Início" e não "Dashboard" — pedido explícito nas observações do protótipo.
 */
export const navItems: NavItem[] = [
  {
    title: "Início",
    href: "/inicio",
    icon: Home,
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
    description: "Visão geral do dia",
  },
  {
    title: "Fila de triagem",
    href: "/triagem",
    icon: ClipboardCheck,
    roles: ["TRIAGEM"],
    description: "Pedidos por triar",
  },
  {
    title: "Teleconsultas",
    href: "/teleconsultas",
    icon: Stethoscope,
    roles: ["TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
    description: "Pedidos e agenda",
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
    title: "Disponibilidade",
    href: "/disponibilidade",
    icon: CalendarClock,
    roles: ["PEDIATRA", "ADMINISTRATIVO"],
    description: "Turnos e janelas de atendimento",
  },
  {
    title: "Histórico clínico",
    href: "/historico-clinico",
    icon: FileHeart,
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
    description: "Pedidos encerrados",
  },
  {
    title: "Notificações",
    href: "/notificacoes",
    icon: Bell,
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
    description: "Notificações internas",
  },
  {
    title: "Administração",
    href: "/administracao",
    icon: Settings2,
    roles: ["ADMINISTRATIVO"],
    description: "Utilizadores e relatórios",
  },
  {
    title: "Perfil",
    href: "/perfil",
    icon: UserRound,
    roles: ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"],
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

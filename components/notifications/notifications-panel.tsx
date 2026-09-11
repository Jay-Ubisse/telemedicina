"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hospital,
  Pill,
  UserCheck,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useNotifications } from "@/lib/store/selectors";
import type { AppNotification, NotificationKind } from "@/lib/types/notification";
import {
  SIMULATED_NOTIFICATION_LABEL,
  notificationKindLabels,
} from "@/lib/types/notification";
import type { User } from "@/lib/types/user";
import { timeAgo } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

const icons: Record<NotificationKind, typeof Bell> = {
  PEDIDO_RECEBIDO: FileText,
  TRIAGEM_CONCLUIDA: ClipboardCheck,
  PRIORIDADE_ALTERADA: AlertTriangle,
  PEDIDO_ATRIBUIDO: UserCheck,
  AGENDAMENTO_CRIADO: CalendarClock,
  AGENDAMENTO_ALTERADO: CalendarClock,
  PEDIDO_ALTERACAO: CalendarClock,
  CONSULTA_PROXIMA: Bell,
  CONSULTA_CONCLUIDA: CheckCircle2,
  ORIENTACAO_DISPONIVEL: FileText,
  PRESCRICAO_DISPONIVEL: Pill,
  ENCAMINHAMENTO: Hospital,
  CANCELAMENTO: XCircle,
  ACTUALIZACAO: Bell,
};

/**
 * Área de notificações de cada painel (§9 do relatório).
 *
 * Enquanto não existir integração externa, cada notificação é marcada como
 * «Notificação simulada» — nunca como «SMS enviado».
 */
export function NotificationsPanel({
  user,
  limit = 5,
  showAllLink = true,
  className,
}: {
  user: User;
  limit?: number;
  showAllLink?: boolean;
  className?: string;
}) {
  const notifications = useNotifications(user.id);
  const markAllRead = useClinicStore((state) => state.markAllNotificationsRead);

  const unread = notifications.filter((item) => !item.readAt).length;
  const visible = limit > 0 ? notifications.slice(0, limit) : notifications;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Bell className="size-4" />
          </span>
          <div>
            <h2 className="font-bold tracking-tight">Notificações</h2>
            <p className="text-xs text-muted-foreground">
              {unread > 0
                ? `${unread} não ${unread === 1 ? "lida" : "lidas"}`
                : "Sem notificações novas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead(user.id)}
            >
              <CheckCheck data-icon="inline-start" />
              Marcar lidas
            </Button>
          ) : null}

          {showAllLink ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/notificacoes">
                Ver todas
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<BellOff className="size-5" />}
            title="Sem notificações"
            description="As notificações internas deste perfil aparecem aqui: novos pedidos, conclusão da triagem, atribuições, agendamentos, alterações e cancelamentos."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((item) => (
            <NotificationRow key={item.id} notification={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function NotificationRow({
  notification,
}: {
  notification: AppNotification;
}) {
  const markRead = useClinicStore((state) => state.markNotificationRead);
  const Icon = icons[notification.kind];
  const unread = !notification.readAt;

  const body = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          unread ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("text-sm", unread ? "font-bold" : "font-semibold")}>
            {notification.title}
          </span>
          {unread ? (
            <span
              aria-label="Não lida"
              className="size-1.5 rounded-full bg-primary"
            />
          ) : null}
        </span>

        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {notification.body}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2">
          {/* Etiqueta obrigatória: nada é enviado para fora da plataforma. */}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {SIMULATED_NOTIFICATION_LABEL}
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">
            {notificationKindLabels[notification.kind]} ·{" "}
            {timeAgo(notification.createdAt)}
          </span>
        </span>
      </span>
    </>
  );

  return (
    <li>
      {notification.consultationId ? (
        <Link
          href={`/teleconsultas/${notification.consultationId}`}
          onClick={() => markRead(notification.id)}
          className="flex gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => markRead(notification.id)}
          className="flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
        >
          {body}
        </button>
      )}
    </li>
  );
}

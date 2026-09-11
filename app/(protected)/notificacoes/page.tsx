"use client";

import { Bell, Trash2 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useNotifications } from "@/lib/store/selectors";
import { SIMULATED_NOTIFICATION_LABEL } from "@/lib/types/notification";
import { roleLabels } from "@/lib/types/user";

/**
 * Notificações internas (§9 do relatório).
 *
 * Enquanto não existir integração externa, todas as notificações são
 * identificadas como «Notificação simulada» — nunca como «SMS enviado».
 */
export default function NotificacoesPage() {
  const user = useSession();
  const notifications = useNotifications(user.id);
  const clearNotifications = useClinicStore((state) => state.clearNotifications);

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <>
      <AppHeader
        user={user}
        title="Notificações"
        subtitle={`${roleLabels[user.role]} · ${notifications.length} ${
          notifications.length === 1 ? "notificação" : "notificações"
        }${unread > 0 ? `, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : ""}`}
        actions={
          notifications.length > 0 ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => clearNotifications(user.id)}
            >
              <Trash2 data-icon="inline-start" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          ) : null
        }
      />

      <PageShell>
        <Alert variant="info">
          <Bell />
          <AlertTitle>{SIMULATED_NOTIFICATION_LABEL}</AlertTitle>
          <AlertDescription>
            Este protótipo não tem integração com serviços externos de mensagens.
            Todas as notificações são internas à plataforma e identificadas como
            simuladas — nenhuma corresponde a um SMS realmente enviado.
          </AlertDescription>
        </Alert>

        <NotificationsPanel user={user} limit={0} showAllLink={false} />
      </PageShell>
    </>
  );
}

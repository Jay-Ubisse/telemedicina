"use client";

import { useState } from "react";
import { CalendarClock, History, Info, RefreshCcw } from "lucide-react";

import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/lib/hooks/use-feedback";
import {
  canReschedule,
  canSchedule,
} from "@/lib/auth/access";
import {
  DEFAULT_DURATION_MINUTES,
  useClinicStore,
} from "@/lib/store/clinic-store";
import { useDoctorAvailability } from "@/lib/store/selectors";
import type { Consultation, ConsultationChannel } from "@/lib/types/consultation";
import { channelLabels, channelOptions } from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/utils/date";

const durations = [15, 20, 25, 30, 45, 60];

/**
 * Definição e actualização do horário (§8 do relatório).
 *
 * «Definir horário» recolhe data, hora, duração, canal e observações.
 * «Actualizar agendamento» exige nova data, nova hora e motivo — e guarda o
 * horário anterior, o autor da alteração e notifica os envolvidos.
 */
export function SchedulingPanel({
  consultation,
  viewer,
}: {
  consultation: Consultation;
  viewer: User;
}) {
  const scheduleConsultation = useClinicStore(
    (state) => state.scheduleConsultation,
  );
  const updateSchedule = useClinicStore((state) => state.updateSchedule);
  const availability = useDoctorAvailability(viewer.id);
  const { feedback, report, clear } = useFeedback();

  const [scheduledAt, setScheduledAt] = useState(
    consultation.scheduledAt
      ? toDateTimeLocalValue(consultation.scheduledAt)
      : "",
  );
  const [duration, setDuration] = useState(
    consultation.durationMinutes ?? DEFAULT_DURATION_MINUTES,
  );
  const [channel, setChannel] = useState<ConsultationChannel>(
    consultation.channel,
  );
  const [notes, setNotes] = useState(consultation.schedulingNotes);
  const [reason, setReason] = useState("");

  const maySchedule = canSchedule(viewer, consultation);
  const mayReschedule = canReschedule(viewer, consultation);

  function handleSchedule(event: React.FormEvent) {
    event.preventDefault();

    const result = scheduleConsultation(consultation.id, {
      scheduledAt,
      durationMinutes: duration,
      channel,
      notes,
      byId: viewer.id,
    });

    report(
      result,
      "Horário definido. O encarregado e a administração foram notificados.",
    );
  }

  function handleReschedule(event: React.FormEvent) {
    event.preventDefault();

    const result = updateSchedule(consultation.id, {
      scheduledAt,
      durationMinutes: duration,
      channel,
      reason,
      byId: viewer.id,
    });

    if (
      report(
        result,
        "Agendamento actualizado. O horário anterior ficou registado e os envolvidos foram notificados.",
      )
    ) {
      setReason("");
    }
  }

  const upcoming = availability
    .filter((entry) => entry.state === "ACTIVA" && entry.kind !== "AUSENCIA")
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <FeedbackAlert feedback={feedback} />

      {/* Agendamento actual */}
      {consultation.scheduledAt ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <h2 className="font-bold tracking-tight">Agendamento actual</h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Data e hora
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDateTime(consultation.scheduledAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Duração prevista
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {consultation.durationMinutes ?? DEFAULT_DURATION_MINUTES} minutos
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Modalidade
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {channelLabels[consultation.channel]}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Observações
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {consultation.schedulingNotes || "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {/* Histórico de alterações do agendamento */}
      {consultation.scheduleHistory.length > 0 ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <h2 className="flex items-center gap-2 font-bold tracking-tight">
            <History className="size-4 text-muted-foreground" />
            Alterações do agendamento
          </h2>

          <ul className="mt-4 space-y-3">
            {consultation.scheduleHistory.map((change) => (
              <li
                key={change.id}
                className="border-l-2 border-border pl-3.5 text-sm"
              >
                <p className="font-medium">
                  {change.previousScheduledAt
                    ? formatDateTime(change.previousScheduledAt)
                    : "Sem horário"}{" "}
                  → {formatDateTime(change.newScheduledAt)}
                </p>
                <p className="text-muted-foreground">
                  {change.byName} · {formatDateTime(change.at)} ·{" "}
                  {change.newDurationMinutes} min
                </p>
                <p className="mt-0.5 leading-relaxed text-muted-foreground">
                  Motivo: {change.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Formulário: definir ou actualizar */}
      {maySchedule || mayReschedule ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <h2 className="font-bold tracking-tight">
            {mayReschedule ? "Actualizar agendamento" : "Definir horário"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {mayReschedule
              ? "Indique a nova data, a nova hora e o motivo da alteração. O horário anterior fica registado."
              : "Escolha a data, a hora, a duração prevista, a modalidade e as observações do atendimento."}
          </p>

          {upcoming.length > 0 ? (
            <div className="mt-4 rounded-xl bg-muted/50 p-3.5">
              <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                A sua disponibilidade registada
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {upcoming.map((entry) => (
                  <li key={entry.id}>
                    {entry.date} · {entry.startTime}–{entry.endTime} ·{" "}
                    {channelLabels[entry.modality]} · {entry.durationMinutes} min
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form
            onSubmit={mayReschedule ? handleReschedule : handleSchedule}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="schedule-at" className="text-sm font-semibold">
                  {mayReschedule ? "Nova data e hora" : "Data e hora"}
                  <span aria-hidden className="ml-0.5 text-destructive">
                    *
                  </span>
                </Label>
                <Input
                  id="schedule-at"
                  type="datetime-local"
                  required
                  aria-required="true"
                  value={scheduledAt}
                  onChange={(event) => {
                    setScheduledAt(event.target.value);
                    clear();
                  }}
                  // Não se marca uma teleconsulta para trás.
                  min={toDateTimeLocalValue(new Date())}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Só são aceites horários futuros.
                </p>
              </div>

              <div>
                <Label htmlFor="schedule-duration" className="text-sm font-semibold">
                  Duração prevista
                </Label>
                <Select
                  value={String(duration)}
                  onValueChange={(value) => {
                    setDuration(Number(value));
                    clear();
                  }}
                >
                  <SelectTrigger
                    id="schedule-duration"
                    className="mt-2 h-11 w-full rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="schedule-channel" className="text-sm font-semibold">
                  Modalidade
                </Label>
                <Select
                  value={channel}
                  onValueChange={(value) => {
                    setChannel(value as ConsultationChannel);
                    clear();
                  }}
                >
                  <SelectTrigger
                    id="schedule-channel"
                    className="mt-2 h-11 w-full rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {channelLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {channel === "VIDEO" ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    O acesso à sala é disponibilizado ao encarregado por
                    notificação simulada e expira 10 minutos após a hora marcada.
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="schedule-notes" className="text-sm font-semibold">
                  Observações{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="schedule-notes"
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    clear();
                  }}
                  placeholder="Ex.: ter o boletim de vacinas à mão."
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>
            </div>

            {mayReschedule ? (
              <div>
                <Label htmlFor="schedule-reason" className="text-sm font-semibold">
                  Motivo da alteração
                  <span aria-hidden className="ml-0.5 text-destructive">
                    *
                  </span>
                </Label>
                <Textarea
                  id="schedule-reason"
                  rows={3}
                  required
                  aria-required="true"
                  minLength={10}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    clear();
                  }}
                  placeholder="Explique porque o horário mudou. O motivo é comunicado ao encarregado."
                  className="mt-2 rounded-xl"
                />
              </div>
            ) : null}

            <Button type="submit" size="xl" className="w-full sm:w-auto">
              {mayReschedule ? (
                <>
                  <RefreshCcw data-icon="inline-start" />
                  Actualizar agendamento
                </>
              ) : (
                <>
                  <CalendarClock data-icon="inline-start" />
                  Definir horário
                </>
              )}
            </Button>
          </form>
        </section>
      ) : (
        <Alert variant="info">
          <Info />
          <AlertTitle>Agendamento</AlertTitle>
          <AlertDescription>
            {consultation.assignedDoctorId
              ? "O horário é definido ou confirmado pelo pediatra responsável pelo pedido."
              : "O horário só pode ser definido depois de o pedido ser atribuído a um pediatra."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarPlus,
  Info,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { AvailabilityBadge } from "@/components/telemedicine/availability-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { useClinicStore } from "@/lib/store/clinic-store";
import {
  compareAvailability,
  useAvailability,
  usePediatricians,
} from "@/lib/store/selectors";
import type {
  Availability,
  AvailabilityKind,
  AvailabilityState,
} from "@/lib/types/availability";
import {
  availabilityKindLabels,
  availabilityStateLabels,
} from "@/lib/types/availability";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { channelLabels, channelOptions } from "@/lib/types/consultation";
import { shiftLabels, shortShiftLabels } from "@/lib/types/user";
import {
  availabilityCovers,
  describeShiftWindow,
  doctorAvailabilityStatus,
  rankDoctorsByAvailability,
} from "@/lib/utils/availability";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  modality: ConsultationChannel;
  kind: AvailabilityKind;
  state: AvailabilityState;
  notes: string;
};

function todayIso() {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

const emptyForm: FormState = {
  date: todayIso(),
  startTime: "08:00",
  endTime: "12:00",
  durationMinutes: 20,
  modality: "VIDEO",
  kind: "TURNO",
  state: "ACTIVA",
  notes: "",
};

const durations = [15, 20, 25, 30, 45, 60];

/**
 * Disponibilidade e escala (§8 e §14 do relatório).
 *
 * O pediatra indica dia, hora inicial e final, duração prevista, modalidade
 * (texto, áudio ou vídeo), estado e observações. O perfil administrativo consulta
 * esta informação para atribuir os pedidos.
 *
 * A leitura distingue, como o relatório exige, conta activa, turno registado,
 * disponibilidade no momento, disponibilidade adicional e ausência ou
 * indisponibilidade — por isso um pediatra do turno da tarde nunca aparece
 * disponível durante a manhã.
 */
export default function DisponibilidadePage() {
  const user = useSession();
  const availability = useAvailability();
  const pediatricians = usePediatricians();

  const addAvailability = useClinicStore((state) => state.addAvailability);
  const updateAvailability = useClinicStore((state) => state.updateAvailability);
  const cancelAvailability = useClinicStore((state) => state.cancelAvailability);
  const removeAvailability = useClinicStore((state) => state.removeAvailability);
  const updateProfile = useClinicStore((state) => state.updateProfile);

  const { feedback, report, clear } = useFeedback();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Availability | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const isDoctor = user.role === "PEDIATRA";

  const ranked = useMemo(
    () => rankDoctorsByAvailability(pediatricians, availability),
    [pediatricians, availability],
  );

  const own = useMemo(
    () =>
      availability
        .filter((entry) => entry.doctorId === user.id)
        .sort(compareAvailability),
    [availability, user.id],
  );

  const myStatus = doctorAvailabilityStatus(user, availability);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    clear();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
    clear();
  }

  function openEdit(entry: Availability) {
    setEditing(entry);
    setForm({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationMinutes: entry.durationMinutes,
      modality: entry.modality,
      kind: entry.kind,
      state: entry.state,
      notes: entry.notes,
    });
    setFormOpen(true);
    clear();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = editing
      ? updateAvailability(editing.id, form)
      : addAvailability({ ...form, doctorId: user.id });

    if (
      report(
        result,
        editing ? "Disponibilidade actualizada." : "Disponibilidade registada.",
      )
    ) {
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
    }
  }

  return (
    <>
      <AppHeader
        user={user}
        title="Disponibilidade"
        subtitle={
          isDoctor
            ? "Os seus turnos, disponibilidades adicionais e ausências."
            : "Escala do serviço de pediatria, para atribuição de pedidos."
        }
        actions={
          isDoctor ? (
            <Button size="lg" onClick={openCreate}>
              <CalendarPlus data-icon="inline-start" />
              <span className="hidden sm:inline">Registar disponibilidade</span>
            </Button>
          ) : null
        }
      />

      <PageShell>
        <FeedbackAlert feedback={feedback} />

        <Alert variant="info">
          <Info />
          <AlertTitle>Como a disponibilidade é lida</AlertTitle>
          <AlertDescription>
            O serviço distingue a conta activa, o turno registado, a
            disponibilidade declarada no momento, a disponibilidade adicional fora
            do turno e as ausências. Um pediatra não aparece como disponível fora do
            seu turno, salvo se tiver registado uma disponibilidade adicional.
          </AlertDescription>
        </Alert>

        {/* O pediatra: o seu estado e a sua escala */}
        {isDoctor ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Turno registado"
                value={user.shift ? shortShiftLabels[user.shift] : "—"}
                icon={CalendarClock}
                hint={user.shift ? describeShiftWindow(user.shift) : undefined}
              />
              <StatCard
                label="Janelas registadas"
                value={own.filter((entry) => entry.state === "ACTIVA").length}
                icon={CalendarPlus}
                tone="primary"
              />
              <StatCard
                label="Ausências"
                value={
                  own.filter(
                    (entry) => entry.kind === "AUSENCIA" && entry.state === "ACTIVA",
                  ).length
                }
                icon={X}
                tone="danger"
              />
              <StatCard
                label="Disponibilidade adicional"
                value={
                  own.filter(
                    (entry) =>
                      entry.kind === "ADICIONAL" && entry.state === "ACTIVA",
                  ).length
                }
                icon={CalendarClock}
                tone="success"
              />
            </section>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold tracking-tight">
                    A sua situação neste momento
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {user.shift
                      ? `Turno ${shiftLabels[user.shift]}.`
                      : "Sem turno registado."}{" "}
                    A administração vê exactamente este estado ao atribuir pedidos.
                  </p>
                </div>
                <AvailabilityBadge status={myStatus} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Disponibilidade declarada para o turno em curso:
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: true, label: "Disponível" },
                      { value: false, label: "Indisponível" },
                    ] as const
                  ).map((option) => (
                    <Button
                      key={String(option.value)}
                      size="sm"
                      variant={
                        (user.available ?? true) === option.value
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        report(
                          updateProfile(user.id, { available: option.value }),
                          option.value
                            ? "Passou a constar como disponível no turno."
                            : "Passou a constar como indisponível no turno.",
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            {formOpen ? (
              <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold tracking-tight">
                    {editing ? "Alterar disponibilidade" : "Registar disponibilidade"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar formulário"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(null);
                      clear();
                    }}
                  >
                    <X />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label htmlFor="availability-date" className="text-sm font-semibold">
                        Dia
                      </Label>
                      <Input
                        id="availability-date"
                        type="date"
                        required
                        aria-required="true"
                        value={form.date}
                        onChange={(event) => update("date", event.target.value)}
                        className="mt-2 h-11 rounded-xl px-3.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability-start" className="text-sm font-semibold">
                        Hora inicial
                      </Label>
                      <Input
                        id="availability-start"
                        type="time"
                        required
                        aria-required="true"
                        value={form.startTime}
                        onChange={(event) => update("startTime", event.target.value)}
                        className="mt-2 h-11 rounded-xl px-3.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability-end" className="text-sm font-semibold">
                        Hora final
                      </Label>
                      <Input
                        id="availability-end"
                        type="time"
                        required
                        aria-required="true"
                        value={form.endTime}
                        onChange={(event) => update("endTime", event.target.value)}
                        className="mt-2 h-11 rounded-xl px-3.5"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="availability-duration"
                        className="text-sm font-semibold"
                      >
                        Duração prevista
                      </Label>
                      <Select
                        value={String(form.durationMinutes)}
                        onValueChange={(value) =>
                          update("durationMinutes", Number(value))
                        }
                      >
                        <SelectTrigger
                          id="availability-duration"
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
                      <Label
                        htmlFor="availability-modality"
                        className="text-sm font-semibold"
                      >
                        Modalidade
                      </Label>
                      <Select
                        value={form.modality}
                        onValueChange={(value) =>
                          update("modality", value as ConsultationChannel)
                        }
                      >
                        <SelectTrigger
                          id="availability-modality"
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
                    </div>

                    <div>
                      <Label htmlFor="availability-kind" className="text-sm font-semibold">
                        Tipo
                      </Label>
                      <Select
                        value={form.kind}
                        onValueChange={(value) =>
                          update("kind", value as AvailabilityKind)
                        }
                      >
                        <SelectTrigger
                          id="availability-kind"
                          className="mt-2 h-11 w-full rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(availabilityKindLabels) as AvailabilityKind[]
                          ).map((kind) => (
                            <SelectItem key={kind} value={kind}>
                              {availabilityKindLabels[kind]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="availability-state" className="text-sm font-semibold">
                        Estado
                      </Label>
                      <Select
                        value={form.state}
                        onValueChange={(value) =>
                          update("state", value as AvailabilityState)
                        }
                      >
                        <SelectTrigger
                          id="availability-state"
                          className="mt-2 h-11 w-full rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              availabilityStateLabels,
                            ) as AvailabilityState[]
                          ).map((state) => (
                            <SelectItem key={state} value={state}>
                              {availabilityStateLabels[state]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <Label htmlFor="availability-notes" className="text-sm font-semibold">
                        Observações{" "}
                        <span className="font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Textarea
                        id="availability-notes"
                        rows={2}
                        value={form.notes}
                        onChange={(event) => update("notes", event.target.value)}
                        placeholder="Ex.: disponibilidade adicional para casos de seguimento."
                        className="mt-2 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="lg">
                      {editing ? "Guardar alterações" : "Registar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setFormOpen(false);
                        setEditing(null);
                        clear();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-bold tracking-tight">As suas janelas</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Dia, horas, duração prevista, modalidade, estado e observações.
                </p>
              </div>

              {own.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<CalendarClock className="size-5" />}
                    title="Sem disponibilidade registada"
                    description="Registe as suas janelas de atendimento para que a administração possa atribuir-lhe pedidos."
                    action={
                      <Button size="lg" onClick={openCreate}>
                        <CalendarPlus data-icon="inline-start" />
                        Registar disponibilidade
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {own.map((entry) => {
                    const active = availabilityCovers(entry);

                    return (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold tabular-nums">
                              {formatDate(entry.date)} · {entry.startTime}–
                              {entry.endTime}
                            </span>
                            {active ? (
                              <Badge
                                variant="ghost"
                                className="h-5 bg-success/12 px-2 text-[0.625rem] font-bold tracking-wide text-success uppercase"
                              >
                                Em curso
                              </Badge>
                            ) : null}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {availabilityKindLabels[entry.kind]} ·{" "}
                            {channelLabels[entry.modality]} ·{" "}
                            {entry.durationMinutes} min por consulta ·{" "}
                            {availabilityStateLabels[entry.state]}
                          </p>
                          {entry.notes ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.notes}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Alterar disponibilidade"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil />
                          </Button>
                          {entry.state === "ACTIVA" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                report(
                                  cancelAvailability(entry.id),
                                  "Disponibilidade cancelada.",
                                )
                              }
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Eliminar disponibilidade"
                              onClick={() =>
                                report(
                                  removeAvailability(entry.id),
                                  "Disponibilidade eliminada.",
                                )
                              }
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}

        {/* Escala completa — o que a administração consulta para atribuir */}
        <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Users className="size-4" />
              </span>
              <div>
                <h2 className="font-bold tracking-tight">
                  Escala de pediatria do HGM
                </h2>
                <p className="text-xs text-muted-foreground">
                  {ranked.filter((entry) => entry.available).length} de{" "}
                  {ranked.length} disponíveis neste momento
                </p>
              </div>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {ranked.map((entry) => (
              <li key={entry.doctor.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{entry.doctor.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {entry.doctor.specialty ?? "Pediatria"}
                      {entry.doctor.shift
                        ? ` · Turno ${shiftLabels[entry.doctor.shift]}`
                        : " · sem turno registado"}
                    </p>
                  </div>
                  <AvailabilityBadge status={entry.status} />
                </div>

                {entry.activeEntries.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {entry.activeEntries.map((slot) => (
                      <li key={slot.id} className="text-sm text-muted-foreground">
                        Em vigor agora: {slot.startTime}–{slot.endTime} ·{" "}
                        {availabilityKindLabels[slot.kind]} ·{" "}
                        {channelLabels[slot.modality]}
                        {slot.notes ? ` · ${slot.notes}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : entry.upcomingEntries.length > 0 ? (
                  <p
                    className={cn(
                      "mt-3 text-sm text-muted-foreground",
                      entry.available ? "" : "italic",
                    )}
                  >
                    Próxima janela: {formatDate(entry.upcomingEntries[0].date)} ·{" "}
                    {entry.upcomingEntries[0].startTime}–
                    {entry.upcomingEntries[0].endTime} ·{" "}
                    {channelLabels[entry.upcomingEntries[0].modality]}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sem janelas de disponibilidade registadas.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    </>
  );
}

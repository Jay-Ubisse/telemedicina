"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Clock, Info, UserCheck } from "lucide-react";

import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { AvailabilityBadge } from "@/components/telemedicine/availability-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { canAssignDoctor, canReassignDoctor } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useAvailability, usePediatricians } from "@/lib/store/selectors";
import type { Consultation } from "@/lib/types/consultation";
import {
  channelLabels,
  priorityLabels,
  shortChannelLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { shortShiftLabels } from "@/lib/types/user";
import {
  describeShiftWindow,
  rankDoctorsByAvailability,
  slotStart,
} from "@/lib/utils/availability";
import { symptomText } from "@/lib/utils/consultations";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

/**
 * Atribuição do pedido a um pediatra (§7 e §8 do relatório).
 *
 * Depois da triagem, o perfil administrativo consulta a disponibilidade e atribui
 * o pedido. A preferência indicada pelo encarregado é mostrada, mas fica sujeita
 * à disponibilidade: se o profissional estiver indisponível, o ecrã sugere outro
 * pediatra ou permite colocar o pedido em espera por uma data disponível.
 */
export function AssignmentPanel({
  consultation,
  viewer,
}: {
  consultation: Consultation;
  viewer: User;
}) {
  const assignDoctor = useClinicStore((state) => state.assignDoctor);
  const holdAssignment = useClinicStore((state) => state.holdAssignment);
  const pediatricians = usePediatricians();
  const availability = useAvailability();
  const { feedback, report, clear } = useFeedback();

  const ranked = useMemo(
    () => rankDoctorsByAvailability(pediatricians, availability),
    [pediatricians, availability],
  );

  const preferred = ranked.find(
    (entry) => entry.doctor.id === consultation.preferredDoctorId,
  );

  const [selected, setSelected] = useState<string>(
    preferred?.available
      ? preferred.doctor.id
      : (ranked.find((entry) => entry.available)?.doctor.id ?? ""),
  );
  const [note, setNote] = useState("");
  const [holdNote, setHoldNote] = useState("");
  const [holdOpen, setHoldOpen] = useState(false);

  const canAssign =
    canAssignDoctor(viewer, consultation) ||
    canReassignDoctor(viewer, consultation);
  const canHold = canAssignDoctor(viewer, consultation);

  function handleAssign(event: React.FormEvent) {
    event.preventDefault();

    const result = assignDoctor(consultation.id, {
      doctorId: selected,
      assignedById: viewer.id,
      note,
    });

    if (report(result, "Pedido atribuído. O pediatra foi notificado.")) {
      setNote("");
    }
  }

  function handleHold(event: React.FormEvent) {
    event.preventDefault();

    const result = holdAssignment(consultation.id, {
      assignedById: viewer.id,
      note: holdNote,
    });

    if (report(result, "Pedido colocado em espera por disponibilidade.")) {
      setHoldOpen(false);
      setHoldNote("");
    }
  }

  return (
    <div className="space-y-5">
      <FeedbackAlert feedback={feedback} />

      {/*
        Os dez campos que o §7 do relatório exige na vista de atribuição:
        referência, idade, sintomas, prioridade, data/hora, profissional de
        triagem, pediatra atribuído, estado, canal e observações.
      */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Pedido a atribuir</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Row label="Referência" value={consultation.reference} />
          <Row label="Idade" value={`${consultation.childAgeYears} anos`} />
          <Row label="Sintomas" value={symptomText(consultation)} />
          <Row label="Prioridade" value={priorityLabels[consultation.priority]} />
          <Row
            label="Data / hora"
            value={
              consultation.scheduledAt
                ? formatDateTime(consultation.scheduledAt)
                : "Por agendar"
            }
          />
          <Row
            label="Profissional de triagem"
            value={consultation.triageProfessionalName ?? "Por triar"}
          />
          <Row
            label="Pediatra atribuído"
            value={consultation.assignedDoctorName ?? "Por atribuir"}
          />
          <Row label="Estado" value={statusLabels[consultation.status]} />
          <Row label="Canal" value={channelLabels[consultation.channel]} />
          <Row
            label="Observações"
            value={consultation.notes || "Sem observações do encarregado."}
          />
        </dl>

        {consultation.triageObservations ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Observações da triagem
            </p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              {consultation.triageObservations}
            </p>
          </div>
        ) : null}

        {consultation.assignmentNote ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Nota administrativa
            </p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              {consultation.assignmentNote}
            </p>
          </div>
        ) : null}
      </section>

      {/* Preferência do encarregado e a regra que a enquadra */}
      {consultation.preferredDoctorName ? (
        <Alert variant={preferred?.available ? "info" : "warning"}>
          <Info />
          <AlertTitle>
            Preferência indicada: {consultation.preferredDoctorName}
            {preferred ? ` · ${preferred.status === "DISPONIVEL_TURNO" || preferred.status === "DISPONIVEL_ADICIONAL" ? "disponível" : "indisponível"}` : ""}
          </AlertTitle>
          <AlertDescription>
            A preferência fica sujeita à disponibilidade e não garante atendimento
            pelo profissional selecionado. Se estiver indisponível, o sistema pode
            sugerir outro pediatra ou permitir aguardar uma data disponível.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Disponibilidade dos pediatras */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Disponibilidade dos pediatras</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Um pediatra só aparece disponível dentro do turno registado ou com uma
          disponibilidade adicional em vigor.
        </p>

        <form onSubmit={handleAssign} className="mt-5 space-y-4">
          <ul className="grid gap-2.5">
            {ranked.map((entry) => {
              const isSelected = selected === entry.doctor.id;
              const isPreferred =
                entry.doctor.id === consultation.preferredDoctorId;
              const next = entry.upcomingEntries[0];

              return (
                <li key={entry.doctor.id}>
                  <button
                    type="button"
                    disabled={!canAssign || entry.status === "CONTA_INACTIVA"}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelected(entry.doctor.id);
                      clear();
                    }}
                    className={cn(
                      "flex w-full flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3.5 text-left ring-1 transition-all disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected
                        ? "bg-primary-soft ring-primary"
                        : "bg-background ring-border hover:ring-primary/40",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {entry.doctor.name}
                        </span>
                        {isPreferred ? (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-accent-foreground uppercase">
                            Preferência
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {entry.doctor.specialty ?? "Especialidade por definir"}
                        {entry.doctor.shift
                          ? ` · ${shortShiftLabels[entry.doctor.shift]} (${describeShiftWindow(entry.doctor.shift)})`
                          : ""}
                      </span>
                      {entry.activeEntries.length > 0 ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Agora: {entry.activeEntries[0].startTime}–
                          {entry.activeEntries[0].endTime} ·{" "}
                          {shortChannelLabels[entry.activeEntries[0].modality]} ·{" "}
                          {entry.activeEntries[0].durationMinutes} min
                        </span>
                      ) : next ? (
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          Próxima janela: {formatDateTime(slotStart(next).toISOString())}
                        </span>
                      ) : null}
                    </span>

                    <AvailabilityBadge status={entry.status} />
                  </button>
                </li>
              );
            })}
          </ul>

          {canAssign ? (
            <>
              <div>
                <Label htmlFor="assignment-note" className="text-sm font-semibold">
                  Nota da atribuição{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="assignment-note"
                  rows={2}
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    clear();
                  }}
                  placeholder="Ex.: preferência indisponível; atribuído ao pediatra de serviço."
                  className="mt-2 rounded-xl"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" disabled={!selected}>
                  <UserCheck data-icon="inline-start" />
                  {consultation.assignedDoctorId
                    ? "Reatribuir pediatra"
                    : "Atribuir pediatra"}
                </Button>

                {canHold ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setHoldOpen((value) => !value)}
                  >
                    <CalendarClock data-icon="inline-start" />
                    Aguardar data disponível
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <Alert variant="info">
              <Info />
              <AlertDescription>
                A atribuição de pedidos é feita pelo perfil administrativo, depois
                da triagem.
              </AlertDescription>
            </Alert>
          )}
        </form>

        {holdOpen && canHold ? (
          <form
            onSubmit={handleHold}
            className="mt-4 space-y-3 border-t border-border pt-4"
          >
            <Label htmlFor="hold-note" className="text-sm font-semibold">
              Motivo da espera
            </Label>
            <Textarea
              id="hold-note"
              rows={3}
              required
              aria-required="true"
              minLength={10}
              value={holdNote}
              onChange={(event) => {
                setHoldNote(event.target.value);
                clear();
              }}
              placeholder="Ex.: o pediatra indicado como preferência está ausente hoje; pedido em espera pela próxima data disponível."
              className="rounded-xl"
            />
            <Button type="submit" size="lg">
              Colocar em espera
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

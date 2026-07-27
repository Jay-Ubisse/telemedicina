import Link from "next/link";
import { CalendarClock, Link2, MapPin, Phone, Video } from "lucide-react";

import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Button } from "@/components/ui/button";
import type { Consultation } from "@/lib/types/consultation";
import { isMeetingLinkValid } from "@/lib/utils/consultations";
import { describeAgeYears, formatTime, minutesUntil } from "@/lib/utils/date";

export function NextConsultation({
  consultation,
}: {
  consultation?: Consultation;
}) {
  if (!consultation) {
    return (
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Próxima teleconsulta</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Sem teleconsultas agendadas de momento.
        </p>
      </section>
    );
  }

  const minutes = consultation.scheduledAt
    ? minutesUntil(consultation.scheduledAt)
    : null;

  const countdown =
    consultation.status === "EM_CURSO"
      ? "A decorrer agora"
      : minutes === null
        ? "Sem horário definido"
        : minutes >= 0
          ? `Começa em ${minutes} min`
          : `Devia ter começado há ${Math.abs(minutes)} min`;

  const linkValid = isMeetingLinkValid(consultation);

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div className="bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--accent),var(--primary)_60%)] px-5 py-4 text-white">
        <p className="text-[0.625rem] font-bold tracking-[0.16em] uppercase opacity-80">
          Próxima teleconsulta
        </p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tabular-nums">
            {consultation.scheduledAt ? formatTime(consultation.scheduledAt) : "--:--"}
          </span>
          <span className="text-sm opacity-85">{countdown}</span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="font-semibold">
            {consultation.childName}{" "}
            <span className="font-normal text-muted-foreground">
              · {describeAgeYears(consultation.childAgeYears)}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Encarregado: {consultation.guardianName}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={consultation.priority} />
          <StatusBadge status={consultation.status} />
          <ChannelBadge channel={consultation.channel} />
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dd className="text-muted-foreground">{consultation.location}</dd>
          </div>
          <div className="flex gap-2.5">
            <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dd className="text-muted-foreground">{consultation.phone}</dd>
          </div>
          <div className="flex gap-2.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dd className="text-muted-foreground">
              {[...consultation.symptoms, consultation.otherSymptom]
                .filter(Boolean)
                .join(", ")}
            </dd>
          </div>
          {consultation.channel === "VIDEO" ? (
            <div className="flex gap-2.5">
              <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <dd className="text-muted-foreground">
                {linkValid
                  ? "Link da sala activo e enviado por SMS"
                  : "Link ainda não gerado ou já expirado"}
              </dd>
            </div>
          ) : null}
        </dl>

        <Button asChild size="lg" className="w-full">
          <Link href={`/teleconsultas/${consultation.id}`}>
            <Video data-icon="inline-start" />
            {consultation.status === "EM_CURSO"
              ? "Entrar na sala"
              : "Abrir teleconsulta"}
          </Link>
        </Button>
      </div>
    </section>
  );
}

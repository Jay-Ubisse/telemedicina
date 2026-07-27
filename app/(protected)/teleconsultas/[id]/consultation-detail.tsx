"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Hospital,
  Link2,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Play,
  Send,
  Upload,
  User as UserIcon,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { ConsultationRoom } from "@/components/telemedicine/consultation-room";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MEETING_LINK_GRACE_MINUTES, useClinicStore } from "@/lib/store/clinic-store";
import { usePediatricians } from "@/lib/store/selectors";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { channelLabels } from "@/lib/types/consultation";
import { isMeetingLinkValid } from "@/lib/utils/consultations";
import {
  describeAgeYears,
  formatDateTime,
  formatTime,
  timeAgo,
  toDateTimeLocalValue,
} from "@/lib/utils/date";

export function ConsultationDetail({ id }: { id: string }) {
  const user = useSession();
  const router = useRouter();

  const consultation = useClinicStore((state) =>
    state.consultations.find((item) => item.id === id),
  );
  const pediatricians = usePediatricians();

  const scheduleConsultation = useClinicStore((state) => state.scheduleConsultation);
  const startConsultation = useClinicStore((state) => state.startConsultation);
  const completeConsultation = useClinicStore((state) => state.completeConsultation);
  const referConsultation = useClinicStore((state) => state.referConsultation);
  const resendMeetingLink = useClinicStore((state) => state.resendMeetingLink);
  const addAttachment = useClinicStore((state) => state.addAttachment);
  const cancelConsultation = useClinicStore((state) => state.cancelConsultation);

  const [tab, setTab] = useState("pedido");
  const [feedback, setFeedback] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);

  const isClinician = user.role === "PEDIATRA" || user.role === "ADMIN";

  // Estado dos formulários de acção
  const [scheduledAt, setScheduledAt] = useState("");
  const [doctorId, setDoctorId] = useState(
    user.role === "PEDIATRA" ? user.id : (pediatricians[0]?.id ?? ""),
  );
  const [channel, setChannel] = useState<ConsultationChannel>("VIDEO");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [guidance, setGuidance] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const symptomText = useMemo(
    () =>
      consultation
        ? [...consultation.symptoms, consultation.otherSymptom]
            .filter(Boolean)
            .join(", ")
        : "",
    [consultation],
  );

  if (!consultation) {
    return (
      <>
        <AppHeader user={user} title="Teleconsulta" />
        <PageShell>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <EmptyState
              icon={<AlertCircle className="size-5" />}
              title="Pedido não encontrado"
              description="Este pedido pode ter sido removido ou pertence a outra conta."
              action={
                <Button asChild size="lg">
                  <Link href="/teleconsultas">Voltar à lista</Link>
                </Button>
              }
            />
          </div>
        </PageShell>
      </>
    );
  }

  const linkValid = isMeetingLinkValid(consultation);
  const canJoinRoom =
    consultation.status === "EM_CURSO" || consultation.status === "AGENDADA";

  function notify(result: { ok: boolean; error?: string }, success: string) {
    if (result.ok) {
      setFeedback({ type: "ok", text: success });
    } else {
      setFeedback({ type: "error", text: result.error ?? "Ocorreu um erro." });
    }
  }

  function handleSchedule(event: React.FormEvent) {
    event.preventDefault();
    const result = scheduleConsultation(consultation!.id, {
      scheduledAt,
      doctorId,
      channel,
    });

    notify(
      result,
      channel === "VIDEO"
        ? `Teleconsulta agendada. Link enviado por SMS para ${consultation!.phone}.`
        : "Teleconsulta agendada. O pediatra fará a chamada de voz à hora marcada.",
    );
  }

  function handleStart() {
    const result = startConsultation(consultation!.id, user.id);
    notify(result, "Teleconsulta iniciada. Entre na sala quando estiver pronto.");
    if (result.ok) setTab("sala");
  }

  function handleComplete(event: React.FormEvent) {
    event.preventDefault();
    const result = completeConsultation(consultation!.id, {
      clinicalNotes,
      guidance,
    });
    notify(result, "Teleconsulta concluída e registada no histórico clínico.");
  }

  function handleRefer(event: React.FormEvent) {
    event.preventDefault();
    const result = referConsultation(consultation!.id, referralReason);
    notify(result, "Caso encaminhado para atendimento presencial.");
  }

  function handleAttachment(event: React.FormEvent) {
    event.preventDefault();
    const result = addAttachment(consultation!.id, {
      name: attachmentName,
      kind: "EXAME",
    });
    notify(result, "Anexo adicionado ao pedido.");
    if (result.ok) setAttachmentName("");
  }

  function handleCancel() {
    const result = cancelConsultation(consultation!.id);
    if (result.ok) {
      router.push("/teleconsultas");
      return;
    }
    notify(result, "");
  }

  return (
    <>
      <AppHeader
        user={user}
        title={consultation.childName}
        subtitle={`${consultation.reference} · ${describeAgeYears(
          consultation.childAgeYears,
        )} · ${timeAgo(consultation.createdAt)}`}
        actions={
          <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
            <Link href="/teleconsultas">
              <ArrowLeft data-icon="inline-start" />
              Voltar
            </Link>
          </Button>
        }
      />

      <PageShell>
        {consultation.priority === "CRITICA" ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Emergência pediátrica</AlertTitle>
            <AlertDescription>
              A triagem automática classificou este pedido como crítico e
              encaminhou-o para atendimento presencial imediato.
              {consultation.referralReason
                ? ` ${consultation.referralReason}`
                : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        {feedback ? (
          <Alert variant={feedback.type === "ok" ? "success" : "destructive"}>
            {feedback.type === "ok" ? <CheckCircle2 /> : <AlertCircle />}
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={consultation.status} />
          <PriorityBadge priority={consultation.priority} />
          <ChannelBadge channel={consultation.channel} />
          <span className="text-xs text-muted-foreground">
            Origem: {consultation.source}
          </span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pedido">
              <FileText />
              Pedido
            </TabsTrigger>
            <TabsTrigger value="sala" disabled={!canJoinRoom}>
              <MessageSquare />
              Sala
            </TabsTrigger>
            {isClinician ? (
              <TabsTrigger value="registo">
                <CheckCircle2 />
                Registo clínico
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="anexos">
              <Paperclip />
              Anexos ({consultation.attachments.length})
            </TabsTrigger>
          </TabsList>

          {/* --- Pedido --- */}
          <TabsContent value="pedido" className="mt-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-6">
                <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                  <h2 className="font-bold tracking-tight">Detalhes do pedido</h2>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Detail
                      icon={<UserIcon className="size-4" />}
                      label="Encarregado"
                      value={consultation.guardianName}
                    />
                    <Detail
                      icon={<Phone className="size-4" />}
                      label="Telefone"
                      value={consultation.phone}
                    />
                    <Detail
                      icon={<MapPin className="size-4" />}
                      label="Localização"
                      value={consultation.location}
                    />
                    <Detail
                      icon={<CalendarClock className="size-4" />}
                      label="Submetido"
                      value={formatDateTime(consultation.createdAt)}
                    />
                    <Detail
                      icon={<CalendarClock className="size-4" />}
                      label="Marcada para"
                      value={
                        consultation.scheduledAt
                          ? formatDateTime(consultation.scheduledAt)
                          : "Por agendar"
                      }
                    />
                    <Detail
                      icon={<UserIcon className="size-4" />}
                      label="Pediatra"
                      value={consultation.assignedDoctorName ?? "Por atribuir"}
                    />
                  </dl>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Sintomas
                    </p>
                    <p className="mt-2 leading-relaxed">{symptomText || "—"}</p>
                  </div>

                  {consultation.notes ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Observações do encarregado
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {consultation.notes}
                      </p>
                    </div>
                  ) : null}
                </section>

                {consultation.channel === "VIDEO" ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Link da videochamada</h2>

                    {consultation.meetingLink ? (
                      <>
                        <p className="mt-3 rounded-xl bg-muted px-3.5 py-2.5 font-mono text-sm break-all">
                          {consultation.meetingLink}
                        </p>
                        <p className="mt-2.5 text-sm text-muted-foreground">
                          {linkValid
                            ? `Válido até às ${formatTime(
                                consultation.meetingLinkExpiresAt!,
                              )} — ${MEETING_LINK_GRACE_MINUTES} minutos após a hora marcada.`
                            : "Este link já expirou."}
                          {consultation.smsSentAt
                            ? ` SMS enviado ${timeAgo(consultation.smsSentAt).toLowerCase()}.`
                            : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        O link é gerado e enviado por SMS quando a teleconsulta for
                        agendada.
                      </p>
                    )}

                    {isClinician && consultation.scheduledAt ? (
                      <Button
                        variant="outline"
                        size="lg"
                        className="mt-4"
                        onClick={() =>
                          notify(
                            resendMeetingLink(consultation.id),
                            `Link reenviado por SMS para ${consultation.phone}.`,
                          )
                        }
                      >
                        <Send data-icon="inline-start" />
                        Reenviar link por SMS
                      </Button>
                    ) : null}
                  </section>
                ) : null}

                {consultation.guidance || consultation.clinicalNotes ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Resultado da consulta</h2>

                    {consultation.clinicalNotes ? (
                      <div className="mt-4">
                        <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                          Notas clínicas
                        </p>
                        <p className="mt-1.5 leading-relaxed">
                          {consultation.clinicalNotes}
                        </p>
                      </div>
                    ) : null}

                    {consultation.guidance ? (
                      <div className="mt-4">
                        <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                          Orientação
                        </p>
                        <p className="mt-1.5 leading-relaxed">
                          {consultation.guidance}
                        </p>
                      </div>
                    ) : null}

                    {consultation.referralReason ? (
                      <div className="mt-4">
                        <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                          Encaminhamento
                        </p>
                        <p className="mt-1.5 leading-relaxed">
                          {consultation.referralReason}
                        </p>
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>

              {/* Acções */}
              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                {isClinician ? (
                  <>
                    {consultation.status === "PENDENTE" ||
                    consultation.status === "AGENDADA" ? (
                      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                        <h2 className="font-bold tracking-tight">
                          {consultation.status === "AGENDADA"
                            ? "Reagendar"
                            : "Agendar teleconsulta"}
                        </h2>

                        <form onSubmit={handleSchedule} className="mt-4 space-y-4">
                          <div>
                            <Label htmlFor="scheduled-at" className="text-sm font-semibold">
                              Data e hora
                            </Label>
                            <Input
                              id="scheduled-at"
                              type="datetime-local"
                              value={
                                scheduledAt ||
                                (consultation.scheduledAt
                                  ? toDateTimeLocalValue(consultation.scheduledAt)
                                  : "")
                              }
                              onChange={(event) => setScheduledAt(event.target.value)}
                              className="mt-2 h-11 rounded-xl px-3.5"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="doctor" className="text-sm font-semibold">
                              Pediatra responsável
                            </Label>
                            <Select value={doctorId} onValueChange={setDoctorId}>
                              <SelectTrigger id="doctor" className="mt-2 h-11 w-full rounded-xl">
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                              <SelectContent>
                                {pediatricians.map((doctor) => (
                                  <SelectItem key={doctor.id} value={doctor.id}>
                                    {doctor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="channel" className="text-sm font-semibold">
                              Canal
                            </Label>
                            <Select
                              value={channel}
                              onValueChange={(value) =>
                                setChannel(value as ConsultationChannel)
                              }
                            >
                              <SelectTrigger id="channel" className="mt-2 h-11 w-full rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIDEO">
                                  {channelLabels.VIDEO}
                                </SelectItem>
                                <SelectItem value="VOZ">{channelLabels.VOZ}</SelectItem>
                              </SelectContent>
                            </Select>
                            {channel === "VIDEO" ? (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                O link é enviado por SMS e expira{" "}
                                {MEETING_LINK_GRACE_MINUTES} minutos após a hora
                                marcada.
                              </p>
                            ) : null}
                          </div>

                          <Button type="submit" size="lg" className="w-full">
                            <CalendarClock data-icon="inline-start" />
                            {consultation.status === "AGENDADA"
                              ? "Actualizar agendamento"
                              : "Agendar e notificar"}
                          </Button>
                        </form>
                      </section>
                    ) : null}

                    {consultation.status === "AGENDADA" ? (
                      <Button size="xl" className="w-full" onClick={handleStart}>
                        <Play data-icon="inline-start" />
                        Iniciar teleconsulta
                      </Button>
                    ) : null}

                    {consultation.status === "EM_CURSO" ? (
                      <Button
                        size="xl"
                        className="w-full"
                        onClick={() => setTab("sala")}
                      >
                        <MessageSquare data-icon="inline-start" />
                        Ir para a sala
                      </Button>
                    ) : null}

                    {consultation.status !== "ENCAMINHADA" &&
                    consultation.status !== "CONCLUIDA" ? (
                      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                        <h2 className="font-bold tracking-tight">
                          Encaminhar para presencial
                        </h2>
                        <form onSubmit={handleRefer} className="mt-3 space-y-3">
                          <Textarea
                            rows={3}
                            value={referralReason}
                            onChange={(event) => setReferralReason(event.target.value)}
                            placeholder="Motivo clínico do encaminhamento…"
                            className="rounded-xl"
                            aria-label="Motivo do encaminhamento"
                          />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="lg"
                            className="w-full"
                          >
                            <Hospital data-icon="inline-start" />
                            Encaminhar
                          </Button>
                        </form>
                      </section>
                    ) : null}
                  </>
                ) : (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">O seu pedido</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {consultation.status === "PENDENTE"
                        ? "A equipa do HGM está a avaliar o pedido. Será contactado assim que houver horário."
                        : consultation.status === "AGENDADA"
                          ? `Teleconsulta marcada para ${formatDateTime(
                              consultation.scheduledAt!,
                            )} com ${consultation.assignedDoctorName}.`
                          : consultation.status === "EM_CURSO"
                            ? "A teleconsulta está a decorrer. Entre na sala."
                            : consultation.status === "CONCLUIDA"
                              ? "Consulta concluída. Consulte a orientação clínica acima."
                              : "Caso encaminhado para atendimento presencial."}
                    </p>

                    {canJoinRoom ? (
                      <Button
                        size="lg"
                        className="mt-4 w-full"
                        onClick={() => setTab("sala")}
                      >
                        <MessageSquare data-icon="inline-start" />
                        Abrir sala
                      </Button>
                    ) : null}

                    {consultation.status === "PENDENTE" ? (
                      <Button
                        variant="destructive"
                        size="lg"
                        className="mt-2.5 w-full"
                        onClick={handleCancel}
                      >
                        Cancelar pedido
                      </Button>
                    ) : null}
                  </section>
                )}

                {consultation.channel === "VIDEO" && linkValid ? (
                  <Alert variant="info">
                    <Link2 />
                    <AlertDescription>
                      Link da sala activo até às{" "}
                      {formatTime(consultation.meetingLinkExpiresAt!)}.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </aside>
            </div>
          </TabsContent>

          {/* --- Sala --- */}
          <TabsContent value="sala" className="mt-5">
            <ConsultationRoom
              consultation={consultation}
              viewer={user}
              onEnded={() => {
                if (isClinician) {
                  setTab("registo");
                  setFeedback({
                    type: "ok",
                    text: "Chamada encerrada. Registe a orientação clínica para concluir a consulta.",
                  });
                }
              }}
            />
          </TabsContent>

          {/* --- Registo clínico --- */}
          {isClinician ? (
            <TabsContent value="registo" className="mt-5">
              <div className="max-w-3xl rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Encerrar teleconsulta</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  As notas ficam no histórico clínico da criança; a orientação é
                  partilhada com o encarregado.
                </p>

                <form onSubmit={handleComplete} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="clinical-notes" className="text-sm font-semibold">
                      Notas clínicas
                    </Label>
                    <Textarea
                      id="clinical-notes"
                      rows={4}
                      value={clinicalNotes || consultation.clinicalNotes}
                      onChange={(event) => setClinicalNotes(event.target.value)}
                      placeholder="Avaliação, hipótese diagnóstica, sinais observados…"
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guidance" className="text-sm font-semibold">
                      Orientação para o encarregado
                    </Label>
                    <Textarea
                      id="guidance"
                      rows={4}
                      value={guidance || consultation.guidance}
                      onChange={(event) => setGuidance(event.target.value)}
                      placeholder="Medicação, cuidados em casa, sinais de alarme, reavaliação…"
                      className="mt-2 rounded-xl"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="xl"
                    disabled={consultation.status === "CONCLUIDA"}
                  >
                    <CheckCircle2 data-icon="inline-start" />
                    {consultation.status === "CONCLUIDA"
                      ? "Consulta já concluída"
                      : "Concluir teleconsulta"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          ) : null}

          {/* --- Anexos --- */}
          <TabsContent value="anexos" className="mt-5">
            <div className="max-w-3xl space-y-4">
              <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="font-bold tracking-tight">
                    Exames e imagens partilhadas
                  </h2>
                </div>

                {consultation.attachments.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={<Paperclip className="size-5" />}
                      title="Sem anexos"
                      description="Fotografias, exames e relatórios partilhados aparecem aqui."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {consultation.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                            <FileText className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.kind} · {formatDateTime(attachment.addedAt)}
                            </p>
                          </div>
                        </div>

                        <Button variant="outline" size="sm">
                          Visualizar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form
                onSubmit={handleAttachment}
                className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8"
              >
                <Label htmlFor="attachment" className="text-sm font-semibold">
                  Adicionar anexo
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="attachment"
                    value={attachmentName}
                    onChange={(event) => setAttachmentName(event.target.value)}
                    placeholder="ex.: hemograma.pdf"
                    className="h-11 flex-1 rounded-xl px-3.5"
                  />
                  <Button type="submit" size="lg" className="h-11">
                    <Upload data-icon="inline-start" />
                    Anexar
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
      </div>
    </div>
  );
}

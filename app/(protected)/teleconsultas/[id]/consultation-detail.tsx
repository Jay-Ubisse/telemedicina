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
  Lock,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Play,
  Send,
  ShieldAlert,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { AttachmentsPanel } from "@/components/telemedicine/attachments-panel";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { ConsultationRoom } from "@/components/telemedicine/consultation-room";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  accessLevelFor,
  canActOnConsultation,
  canSeeClinicalRecord,
  canSeeContactDetails,
  maskConsultation,
} from "@/lib/auth/access";
import { MEETING_LINK_GRACE_MINUTES, useClinicStore } from "@/lib/store/clinic-store";
import { usePediatricians } from "@/lib/store/selectors";
import type {
  AccessReason,
  ConsultationChannel,
  ConsultationPriority,
} from "@/lib/types/consultation";
import {
  accessReasonLabels,
  channelLabels,
  closedStatuses,
  priorityLabels,
} from "@/lib/types/consultation";
import { formatLocation } from "@/lib/data/locations";
import { shortShiftLabels } from "@/lib/types/user";
import { isMeetingLinkValid } from "@/lib/utils/consultations";
import {
  describeAgeYears,
  formatDateTime,
  formatTime,
  timeAgo,
  toDateTimeLocalValue,
} from "@/lib/utils/date";

/** Classificações que um pediatra pode atribuir depois de avaliar o caso. */
const resolvablePriorities: ConsultationPriority[] = [
  "NORMAL",
  "URGENTE",
  "CRITICA",
];

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
  const grantExceptionalAccess = useClinicStore(
    (state) => state.grantExceptionalAccess,
  );

  const [tab, setTab] = useState("pedido");
  const [feedback, setFeedback] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);

  // Estado dos formulários de acção
  const [scheduledAt, setScheduledAt] = useState("");
  const [doctorId, setDoctorId] = useState(
    user.role === "PEDIATRA" ? user.id : (pediatricians[0]?.id ?? ""),
  );
  const [channel, setChannel] = useState<ConsultationChannel>("VIDEO");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [guidance, setGuidance] = useState("");
  const [finalPriority, setFinalPriority] = useState<ConsultationPriority>("NORMAL");
  const [referralReason, setReferralReason] = useState("");

  // Acesso excepcional (auditoria)
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessReason, setAccessReason] = useState<AccessReason>("APOIO_CLINICO");
  const [accessNote, setAccessNote] = useState("");

  const level = consultation ? accessLevelFor(user, consultation) : "RESTRITO";

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
      <NotFound
        title="Pedido não encontrado"
        description="Este pedido pode ter sido removido ou pertence a outra conta."
      />
    );
  }

  // Um encarregado nunca vê o pedido de outra família.
  if (user.role === "ENCARREGADO" && level !== "COMPLETO") {
    return (
      <NotFound
        title="Acesso não autorizado"
        description="Este pedido pertence a outra família. Só tem acesso aos pedidos das crianças registadas na sua conta."
      />
    );
  }

  const view = maskConsultation(consultation, level);
  const showClinical = canSeeClinicalRecord(level);
  const showContacts = canSeeContactDetails(level);
  const canAct = canActOnConsultation(user, level);
  const isRestricted = level === "RESTRITO";
  const isAdminView = level === "ADMINISTRATIVO";

  const isClosed = closedStatuses.includes(consultation.status);
  const linkValid = isMeetingLinkValid(consultation);
  const needsLink = consultation.channel === "VIDEO";
  // Um link expirado bloqueia a entrada na sala: é a correcção pedida para o
  // pedido R-1041, onde o sistema avisava da expiração mas mantinha o botão.
  const linkExpired =
    needsLink && Boolean(consultation.meetingLink) && !linkValid;
  // Depois de um reenvio fora de horas, o prazo passa a contar do envio e já
  // não da hora marcada.
  const isExtendedWindow =
    Boolean(consultation.scheduledAt && consultation.meetingLinkExpiresAt) &&
    new Date(consultation.meetingLinkExpiresAt!).getTime() >
      new Date(consultation.scheduledAt!).getTime() +
        MEETING_LINK_GRACE_MINUTES * 60_000 +
        1_000;
  const canJoinRoom =
    (consultation.status === "EM_CURSO" || consultation.status === "AGENDADA") &&
    (!needsLink || linkValid) &&
    showClinical;

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
      clinicalNotes: clinicalNotes || consultation!.clinicalNotes,
      guidance: guidance || consultation!.guidance,
      priority:
        consultation!.priority === "AVALIACAO" ? finalPriority : undefined,
    });
    notify(result, "Teleconsulta concluída e registada no histórico clínico.");
  }

  function handleRefer(event: React.FormEvent) {
    event.preventDefault();
    const result = referConsultation(
      consultation!.id,
      referralReason,
      consultation!.priority === "AVALIACAO" ? finalPriority : undefined,
    );
    notify(result, "Caso encaminhado para atendimento presencial.");
  }

  function handleCancel() {
    const result = cancelConsultation(consultation!.id);
    if (result.ok) {
      router.push("/teleconsultas");
      return;
    }
    notify(result, "");
  }

  function handleGrantAccess(event: React.FormEvent) {
    event.preventDefault();
    const result = grantExceptionalAccess(consultation!.id, {
      userId: user.id,
      userName: user.name,
      reason: accessReason,
      note: accessNote,
    });

    if (result.ok) {
      setAccessDialogOpen(false);
      setAccessNote("");
      setFeedback({
        type: "ok",
        text: "Acesso registado para auditoria. O processo clínico completo está agora visível.",
      });
      return;
    }
    notify(result, "");
  }

  return (
    <>
      <AppHeader
        user={user}
        title={view.childName}
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
              {consultation.referralReason ? ` ${consultation.referralReason}` : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        {feedback ? (
          <Alert variant={feedback.type === "ok" ? "success" : "destructive"}>
            {feedback.type === "ok" ? <CheckCircle2 /> : <AlertCircle />}
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}

        {isRestricted ? (
          <Alert variant="warning">
            <Lock />
            <AlertTitle>
              Processo à responsabilidade de {consultation.assignedDoctorName}
            </AlertTitle>
            <AlertDescription>
              Vê apenas a informação necessária para acompanhar o serviço. O
              acesso às notas clínicas, anexos e contactos exige uma
              justificação — substituição do profissional, apoio clínico ou
              encaminhamento interno — que fica registada para auditoria.
            </AlertDescription>
          </Alert>
        ) : null}

        {isAdminView ? (
          <Alert variant="info">
            <Lock />
            <AlertTitle>Vista administrativa</AlertTitle>
            <AlertDescription>
              Estão disponíveis os dados de gestão do pedido. As notas clínicas,
              a orientação, os anexos e o chat da consulta pertencem ao processo
              clínico e não são apresentados neste perfil.
            </AlertDescription>
          </Alert>
        ) : null}

        {linkExpired && !isClosed && showClinical ? (
          <Alert variant="destructive">
            <Link2 />
            <AlertTitle>Link expirado</AlertTitle>
            <AlertDescription>
              O link da videochamada de {consultation.reference} deixou de ser
              válido{" "}
              {consultation.meetingLinkExpiresAt
                ? `às ${formatTime(consultation.meetingLinkExpiresAt)}`
                : ""}
              . A entrada na sala está bloqueada até ser enviado um novo link.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={consultation.status} />
          <PriorityBadge priority={consultation.priority} />
          <ChannelBadge channel={consultation.channel} />
          <span className="text-xs text-muted-foreground">
            Origem: {consultation.source}
          </span>
          {linkExpired && !isClosed ? (
            <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-destructive uppercase">
              Link expirado
            </span>
          ) : null}
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
            {canAct && showClinical ? (
              <TabsTrigger value="registo">
                <CheckCircle2 />
                Registo clínico
              </TabsTrigger>
            ) : null}
            {showClinical ? (
              <TabsTrigger value="anexos">
                <Paperclip />
                Anexos ({consultation.attachments.length})
              </TabsTrigger>
            ) : null}
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
                      value={view.guardianName}
                    />
                    <Detail
                      icon={<Phone className="size-4" />}
                      label="Telefone"
                      value={showContacts ? consultation.phone : view.phone}
                      hint={showContacts ? undefined : "Contacto reservado"}
                    />
                    <Detail
                      icon={<MapPin className="size-4" />}
                      label="Bairro"
                      value={formatLocation(consultation.location)}
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

                  {view.notes ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Observações do encarregado
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {view.notes}
                      </p>
                    </div>
                  ) : null}
                </section>

                {consultation.channel === "VIDEO" && showClinical ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Link da videochamada</h2>

                    {consultation.meetingLink ? (
                      <>
                        <p
                          className={
                            linkValid
                              ? "mt-3 rounded-xl bg-muted px-3.5 py-2.5 text-sm break-all"
                              : "mt-3 rounded-xl bg-muted px-3.5 py-2.5 text-sm break-all text-muted-foreground line-through"
                          }
                        >
                          {consultation.meetingLink}
                        </p>
                        <p className="mt-2.5 text-sm text-muted-foreground">
                          {isClosed
                            ? "A teleconsulta foi encerrada — o link deixou de ser válido."
                            : linkValid
                              ? `Válido até às ${formatTime(
                                  consultation.meetingLinkExpiresAt!,
                                )} — ${MEETING_LINK_GRACE_MINUTES} minutos após ${
                                  isExtendedWindow ? "o reenvio" : "a hora marcada"
                                }.`
                              : "Este link expirou. Reenvie-o por SMS para gerar um novo prazo."}
                          {consultation.smsSentAt
                            ? ` SMS enviado ${timeAgo(consultation.smsSentAt).toLowerCase()}.`
                            : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        O link é gerado e enviado por SMS quando a teleconsulta
                        for agendada.
                      </p>
                    )}

                    {canAct && consultation.scheduledAt && !isClosed ? (
                      <Button
                        variant={linkExpired ? "default" : "outline"}
                        size="lg"
                        className="mt-4"
                        onClick={() =>
                          notify(
                            resendMeetingLink(consultation.id),
                            `Novo link enviado por SMS para ${consultation.phone}. Válido durante mais ${MEETING_LINK_GRACE_MINUTES} minutos.`,
                          )
                        }
                      >
                        <Send data-icon="inline-start" />
                        Reenviar link por SMS
                      </Button>
                    ) : null}
                  </section>
                ) : null}

                {showClinical &&
                (consultation.guidance || consultation.clinicalNotes) ? (
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

                {/* Auditoria dos acessos excepcionais */}
                {showClinical && consultation.accessLog?.length ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">
                      Acessos registados
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {consultation.accessLog.map((entry) => (
                        <li
                          key={entry.id}
                          className="border-l-2 border-border pl-3.5 text-sm"
                        >
                          <p className="font-medium">{entry.userName}</p>
                          <p className="text-muted-foreground">
                            {accessReasonLabels[entry.reason]} ·{" "}
                            {formatDateTime(entry.at)}
                          </p>
                          {entry.note ? (
                            <p className="mt-0.5 text-muted-foreground">
                              {entry.note}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              {/* Acções */}
              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                {isRestricted ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Acesso ao processo</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Só o pediatra responsável acede ao processo clínico
                      completo. Se precisa de intervir neste caso, justifique o
                      acesso.
                    </p>
                    <Button
                      size="lg"
                      className="mt-4 w-full"
                      onClick={() => setAccessDialogOpen(true)}
                    >
                      <ShieldAlert data-icon="inline-start" />
                      Justificar acesso
                    </Button>
                  </section>
                ) : null}

                {isAdminView ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Gestão do pedido</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Origem</dt>
                        <dd className="font-medium">{consultation.source}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Canal</dt>
                        <dd className="font-medium">
                          {channelLabels[consultation.channel]}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Anexos</dt>
                        <dd className="font-medium tabular-nums">
                          {consultation.attachments.length}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Encerrado em</dt>
                        <dd className="font-medium">
                          {consultation.closedAt
                            ? formatDateTime(consultation.closedAt)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </section>
                ) : null}

                {canAct ? (
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
                              // Não se marca uma teleconsulta para trás: o
                              // protótipo testado aceitava datas passadas.
                              min={toDateTimeLocalValue(new Date())}
                              className="mt-2 h-11 rounded-xl px-3.5"
                              required
                              aria-required="true"
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Só são aceites horários futuros.
                            </p>
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
                                    {doctor.shift
                                      ? ` · ${shortShiftLabels[doctor.shift]}`
                                      : ""}
                                    {doctor.available === false
                                      ? " (fora de turno)"
                                      : ""}
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
                      linkExpired ? (
                        <Alert variant="warning">
                          <Link2 />
                          <AlertTitle>Entrada bloqueada</AlertTitle>
                          <AlertDescription>
                            Reenvie o link por SMS para abrir uma nova janela de
                            acesso à sala.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button size="xl" className="w-full" onClick={handleStart}>
                          <Play data-icon="inline-start" />
                          Iniciar teleconsulta
                        </Button>
                      )
                    ) : null}

                    {consultation.status === "EM_CURSO" ? (
                      linkExpired ? (
                        <Alert variant="warning">
                          <Link2 />
                          <AlertTitle>Sala indisponível</AlertTitle>
                          <AlertDescription>
                            O link desta videochamada expirou. Reenvie-o por SMS
                            para retomar a teleconsulta.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          size="xl"
                          className="w-full"
                          onClick={() => setTab("sala")}
                        >
                          <MessageSquare data-icon="inline-start" />
                          Ir para a sala
                        </Button>
                      )
                    ) : null}

                    {!isClosed ? (
                      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                        <h2 className="font-bold tracking-tight">
                          Encaminhar para presencial
                        </h2>
                        <form onSubmit={handleRefer} className="mt-3 space-y-3">
                          <Textarea
                            rows={3}
                            required
                            aria-required="true"
                            value={referralReason}
                            onChange={(event) => setReferralReason(event.target.value)}
                            placeholder="Motivo clínico do encaminhamento…"
                            className="rounded-xl"
                            aria-label="Motivo do encaminhamento"
                          />

                          {consultation.priority === "AVALIACAO" ? (
                            <PriorityResolver
                              value={finalPriority}
                              onChange={setFinalPriority}
                            />
                          ) : null}

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
                ) : null}

                {user.role === "ENCARREGADO" ? (
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

                    {linkExpired && !isClosed ? (
                      <Alert variant="warning" className="mt-4">
                        <Link2 />
                        <AlertDescription>
                          O link desta videochamada expirou. Contacte o HGM para
                          receber um novo link por SMS.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {consultation.status === "PENDENTE" ? (
                      <Button
                        variant="destructive"
                        size="lg"
                        className="mt-2.5 w-full"
                        onClick={handleCancel}
                      >
                        <Trash2 data-icon="inline-start" />
                        Cancelar pedido
                      </Button>
                    ) : null}
                  </section>
                ) : null}

                {consultation.channel === "VIDEO" && linkValid && showClinical ? (
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
            {canJoinRoom ? (
              <ConsultationRoom
                consultation={consultation}
                viewer={user}
                onEnded={() => {
                  if (canAct) {
                    setTab("registo");
                    setFeedback({
                      type: "ok",
                      text: "Chamada encerrada. Registe a orientação clínica para concluir a consulta.",
                    });
                  }
                }}
              />
            ) : (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <EmptyState
                  icon={<Link2 className="size-5" />}
                  title="Sala indisponível"
                  description="O link desta videochamada não está activo. É preciso reenviá-lo por SMS antes de entrar na sala."
                />
              </div>
            )}
          </TabsContent>

          {/* --- Registo clínico --- */}
          {canAct && showClinical ? (
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
                      aria-required="true"
                    />
                  </div>

                  {consultation.priority === "AVALIACAO" ? (
                    <PriorityResolver
                      value={finalPriority}
                      onChange={setFinalPriority}
                    />
                  ) : null}

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
          {showClinical ? (
            <TabsContent value="anexos" className="mt-5">
              <AttachmentsPanel
                attachments={consultation.attachments}
                onAdd={(attachment) => addAttachment(consultation.id, attachment)}
                readOnly={isClosed}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </PageShell>

      {/* Justificação de acesso excepcional */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Justificar acesso ao processo</DialogTitle>
            <DialogDescription>
              O pedido está atribuído a {consultation.assignedDoctorName}. Este
              acesso fica registado com o seu nome, o motivo e a data.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGrantAccess} className="space-y-4">
            <div>
              <Label htmlFor="access-reason" className="text-sm font-semibold">
                Motivo
              </Label>
              <Select
                value={accessReason}
                onValueChange={(value) => setAccessReason(value as AccessReason)}
              >
                <SelectTrigger id="access-reason" className="mt-2 h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSTITUICAO">
                    {accessReasonLabels.SUBSTITUICAO}
                  </SelectItem>
                  <SelectItem value="APOIO_CLINICO">
                    {accessReasonLabels.APOIO_CLINICO}
                  </SelectItem>
                  <SelectItem value="ENCAMINHAMENTO_INTERNO">
                    {accessReasonLabels.ENCAMINHAMENTO_INTERNO}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="access-note" className="text-sm font-semibold">
                Nota <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="access-note"
                rows={3}
                value={accessNote}
                onChange={(event) => setAccessNote(event.target.value)}
                placeholder="Ex.: pediatra responsável fora de turno; caso transferido na passagem de serviço."
                className="mt-2 rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setAccessDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                Registar acesso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Um pedido que entrou como "Avaliação necessária" não pode ser encerrado
 * nesse estado: o pediatra atribui a classificação real ao dar o parecer.
 */
function PriorityResolver({
  value,
  onChange,
}: {
  value: ConsultationPriority;
  onChange: (value: ConsultationPriority) => void;
}) {
  return (
    <div className="rounded-xl bg-primary-soft/60 p-4 ring-1 ring-primary/15">
      <Label htmlFor="final-priority" className="text-sm font-semibold">
        Classificação após avaliação
      </Label>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Este pedido chegou com sintoma em texto livre e ficou em «Avaliação
        necessária». Indique a gravidade que atribui ao caso.
      </p>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as ConsultationPriority)}
      >
        <SelectTrigger id="final-priority" className="mt-3 h-11 w-full rounded-xl bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {resolvablePriorities.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priorityLabels[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NotFound({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const user = useSession();

  return (
    <>
      <AppHeader user={user} title="Teleconsulta" />
      <PageShell>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <EmptyState
            icon={<AlertCircle className="size-5" />}
            title={title}
            description={description}
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

function Detail({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
        {hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

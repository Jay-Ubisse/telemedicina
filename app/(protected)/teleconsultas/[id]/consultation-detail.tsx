"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hospital,
  Link2,
  ListOrdered,
  Lock,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Pill,
  Play,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  User as UserIcon,
} from "lucide-react";

import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { AssignmentPanel } from "@/components/telemedicine/assignment-panel";
import { AttachmentsPanel } from "@/components/telemedicine/attachments-panel";
import { ChannelBadge } from "@/components/telemedicine/channel-badge";
import { ConsultationRoom } from "@/components/telemedicine/consultation-room";
import { PrescriptionPanel } from "@/components/telemedicine/prescription-panel";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { RequestTimeline } from "@/components/telemedicine/request-timeline";
import { SchedulingPanel } from "@/components/telemedicine/scheduling-panel";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { TriagePanel } from "@/components/telemedicine/triage-panel";
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
  canAssignDoctor,
  canCancelRequest,
  canConductConsultation,
  canJoinRoom as canJoinRoomFor,
  canReassignDoctor,
  canReschedule,
  canReviewRequest,
  canSchedule,
  canSeeClinicalRecord,
  canSeeContactDetails,
  canSeePrescription,
  canTriage,
  canWriteClinicalRecord,
  isOwnRequest,
  maskConsultation,
} from "@/lib/auth/access";
import { formatLocation } from "@/lib/data/locations";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { MEETING_LINK_GRACE_MINUTES, useClinicStore } from "@/lib/store/clinic-store";
import type { AccessReason } from "@/lib/types/consultation";
import {
  accessReasonLabels,
  channelLabels,
  closedStatuses,
  statusLabels,
  triageOutcomeLabels,
} from "@/lib/types/consultation";
import { isMeetingLinkValid, symptomText } from "@/lib/utils/consultations";
import {
  describeAgeYears,
  formatDateTime,
  formatTime,
  timeAgo,
} from "@/lib/utils/date";

/**
 * Detalhe do pedido.
 *
 * Os separadores e os botões dependem do perfil e da fase do atendimento, como o
 * §3 do relatório determina: «Realizar triagem» só existe para o profissional de
 * triagem, «Atribuir pediatra» para o administrativo depois da triagem, e
 * «Analisar pedido», «Definir horário», «Realizar consulta» e «Consultar registo»
 * para o pediatra, conforme a fase. O botão «Triar» desapareceu do painel do
 * pediatra.
 */
export function ConsultationDetail({ id }: { id: string }) {
  const user = useSession();
  const searchParams = useSearchParams();

  const consultation = useClinicStore((state) =>
    state.consultations.find((item) => item.id === id),
  );

  const reviewRequest = useClinicStore((state) => state.reviewRequest);
  const startConsultation = useClinicStore((state) => state.startConsultation);
  const completeConsultation = useClinicStore((state) => state.completeConsultation);
  const referConsultation = useClinicStore((state) => state.referConsultation);
  const cancelConsultation = useClinicStore((state) => state.cancelConsultation);
  const requestScheduleChange = useClinicStore(
    (state) => state.requestScheduleChange,
  );
  const resendRoomAccess = useClinicStore((state) => state.resendRoomAccess);
  const addAttachment = useClinicStore((state) => state.addAttachment);
  const grantExceptionalAccess = useClinicStore(
    (state) => state.grantExceptionalAccess,
  );

  /**
   * Separador activo.
   *
   * O separador pedido no URL (`?tab=triagem`) é o ponto de partida — é assim que
   * os botões das listas levam o utilizador directamente à acção que lhe
   * pertence. A escolha manual sobrepõe-se a esse valor, e é descartada se o URL
   * passar a pedir outro separador.
   */
  const requestedTab = searchParams.get("tab") ?? "pedido";
  const [picked, setPicked] = useState<{ from: string; tab: string } | null>(null);
  const tab = picked && picked.from === requestedTab ? picked.tab : requestedTab;

  function setTab(next: string) {
    setPicked({ from: requestedTab, tab: next });
  }

  const { feedback, report, showOk, clear } = useFeedback();

  const [clinicalNotes, setClinicalNotes] = useState("");
  const [guidance, setGuidance] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [changeReason, setChangeReason] = useState("");

  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessReason, setAccessReason] = useState<AccessReason>("APOIO_CLINICO");
  const [accessNote, setAccessNote] = useState("");

  if (!consultation) {
    return (
      <NotFound
        title="Pedido não encontrado"
        description="Este pedido pode ter sido removido ou pertence a outra conta."
      />
    );
  }

  const level = accessLevelFor(user, consultation);

  // Um encarregado nunca vê o pedido de outra família.
  if (user.role === "ENCARREGADO" && !isOwnRequest(user, consultation)) {
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
  const showPrescription = canSeePrescription(user, consultation);
  const isRestricted = level === "RESTRITO" && user.role === "PEDIATRA";
  const isAdminView = level === "ADMINISTRATIVO";
  const isTriageView = level === "TRIAGEM";
  const isGuardian = user.role === "ENCARREGADO";

  const isClosed = closedStatuses.includes(consultation.status);
  const linkValid = isMeetingLinkValid(consultation);
  const needsLink = consultation.channel === "VIDEO";
  // Um acesso expirado bloqueia a entrada na sala.
  const linkExpired =
    needsLink && Boolean(consultation.meetingLink) && !linkValid;
  const roomOpen = canJoinRoomFor(user, consultation) && (!needsLink || linkValid);

  const mayTriage = canTriage(user, consultation);
  const mayAssign =
    canAssignDoctor(user, consultation) || canReassignDoctor(user, consultation);
  const mayReview = canReviewRequest(user, consultation);
  const maySchedule = canSchedule(user, consultation);
  const mayReschedule = canReschedule(user, consultation);
  const mayConduct = canConductConsultation(user, consultation);
  const mayWriteRecord = canWriteClinicalRecord(user, consultation);
  const mayCancel = canCancelRequest(user, consultation);

  const showTriageTab = user.role !== "ENCARREGADO";
  const showAssignmentTab =
    user.role === "ADMINISTRATIVO" && consultation.triagedAt !== null;
  const showSchedulingTab =
    user.role === "PEDIATRA" && consultation.assignedDoctorId === user.id;
  const showRecordTab = showClinical || showPrescription;

  function handleComplete(event: React.FormEvent) {
    event.preventDefault();
    report(
      completeConsultation(consultation!.id, {
        clinicalNotes: clinicalNotes || consultation!.clinicalNotes,
        guidance: guidance || consultation!.guidance,
        byId: user.id,
      }),
      "Teleconsulta concluída e registada no histórico clínico.",
    );
  }

  function handleRefer(event: React.FormEvent) {
    event.preventDefault();
    report(
      referConsultation(consultation!.id, referralReason, user.id),
      "Caso encaminhado para atendimento presencial.",
    );
  }

  function handleCancel(event: React.FormEvent) {
    event.preventDefault();
    report(
      cancelConsultation(consultation!.id, cancelReason, user.id),
      "Pedido cancelado. O registo fica preservado no histórico.",
    );
  }

  function handleChangeRequest(event: React.FormEvent) {
    event.preventDefault();
    if (
      report(
        requestScheduleChange(consultation!.id, changeReason, user.id),
        "Pedido de alteração enviado ao pediatra responsável.",
      )
    ) {
      setChangeReason("");
    }
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
      showOk(
        "Acesso registado para auditoria. O processo clínico completo está agora visível.",
      );
      return;
    }
    report(result, "");
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
        <FeedbackAlert feedback={feedback} />

        {consultation.priority === "CRITICA" && !isClosed ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Pedido classificado como crítico na triagem</AlertTitle>
            <AlertDescription>
              {consultation.triageProfessionalName
                ? `${consultation.triageProfessionalName} classificou este pedido como crítico. `
                : ""}
              Confirme o contacto com o encarregado de educação.
            </AlertDescription>
          </Alert>
        ) : null}

        {isRestricted ? (
          <Alert variant="warning">
            <Lock />
            <AlertTitle>
              Processo à responsabilidade de{" "}
              {consultation.assignedDoctorName ?? "outro profissional"}
            </AlertTitle>
            <AlertDescription>
              Vê apenas a informação necessária para acompanhar o serviço. O acesso
              às notas clínicas, prescrições, anexos e contactos exige uma
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
              Estão disponíveis os dados de gestão do pedido. As notas clínicas, a
              orientação, a prescrição, os anexos e o chat da consulta pertencem ao
              processo clínico e não são apresentados neste perfil.
            </AlertDescription>
          </Alert>
        ) : null}

        {isTriageView ? (
          <Alert variant="info">
            <ClipboardCheck />
            <AlertTitle>Vista de triagem</AlertTitle>
            <AlertDescription>
              Tem acesso aos sintomas, às observações do encarregado e à idade da
              criança — o necessário para classificar o pedido. As notas clínicas e
              as prescrições são do pediatra responsável.
            </AlertDescription>
          </Alert>
        ) : null}

        {linkExpired && !isClosed && showClinical ? (
          <Alert variant="destructive">
            <Link2 />
            <AlertTitle>Acesso à sala expirado</AlertTitle>
            <AlertDescription>
              O acesso à sala de {consultation.reference} deixou de ser válido
              {consultation.meetingLinkExpiresAt
                ? ` às ${formatTime(consultation.meetingLinkExpiresAt)}`
                : ""}
              . A entrada está bloqueada até ser disponibilizado um novo acesso.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={consultation.status} full />
          <PriorityBadge priority={consultation.priority} />
          <ChannelBadge channel={consultation.channel} />
          <span className="text-xs text-muted-foreground">
            Origem: {consultation.source}
          </span>
          {linkExpired && !isClosed ? (
            <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-destructive uppercase">
              Acesso expirado
            </span>
          ) : null}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="pedido">
              <FileText />
              Pedido
            </TabsTrigger>
            {showTriageTab ? (
              <TabsTrigger value="triagem">
                <ClipboardCheck />
                Triagem
              </TabsTrigger>
            ) : null}
            {showAssignmentTab ? (
              <TabsTrigger value="atribuicao">
                <UserCheck />
                Atribuição
              </TabsTrigger>
            ) : null}
            {showSchedulingTab ? (
              <TabsTrigger value="agendamento">
                <CalendarClock />
                Agendamento
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="sala" disabled={!roomOpen}>
              <MessageSquare />
              Sala
            </TabsTrigger>
            {showRecordTab ? (
              <TabsTrigger value="registo">
                <Pill />
                Registo clínico
              </TabsTrigger>
            ) : null}
            {showClinical ? (
              <TabsTrigger value="anexos">
                <Paperclip />
                Anexos ({consultation.attachments.length})
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="percurso">
              <ListOrdered />
              Percurso
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
                      icon={<FileText className="size-4" />}
                      label="Referência"
                      value={consultation.reference}
                    />
                    <Detail
                      icon={<UserIcon className="size-4" />}
                      label="Idade"
                      value={describeAgeYears(consultation.childAgeYears)}
                    />
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
                      icon={<ClipboardCheck className="size-4" />}
                      label="Profissional de triagem"
                      value={consultation.triageProfessionalName ?? "Por triar"}
                      hint={
                        consultation.triagedAt
                          ? formatDateTime(consultation.triagedAt)
                          : undefined
                      }
                    />
                    <Detail
                      icon={<UserCheck className="size-4" />}
                      label="Pediatra atribuído"
                      value={consultation.assignedDoctorName ?? "Por atribuir"}
                      hint={
                        consultation.assignedByName
                          ? `Atribuído por ${consultation.assignedByName}`
                          : undefined
                      }
                    />
                    <Detail
                      icon={<CalendarClock className="size-4" />}
                      label="Data / hora da consulta"
                      value={
                        consultation.scheduledAt
                          ? `${formatDateTime(consultation.scheduledAt)}${
                              consultation.durationMinutes
                                ? ` · ${consultation.durationMinutes} min`
                                : ""
                            }`
                          : "Por agendar"
                      }
                    />
                    <Detail
                      icon={<MessageSquare className="size-4" />}
                      label="Canal"
                      value={channelLabels[consultation.channel]}
                    />
                    <Detail
                      icon={<ListOrdered className="size-4" />}
                      label="Estado"
                      value={statusLabels[consultation.status]}
                    />
                    {consultation.preferredDoctorName ? (
                      <Detail
                        icon={<UserIcon className="size-4" />}
                        label="Pediatra de preferência"
                        value={consultation.preferredDoctorName}
                        hint="Sujeita à disponibilidade"
                      />
                    ) : null}
                  </dl>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Sintomas
                    </p>
                    <p className="mt-2 leading-relaxed">
                      {symptomText(consultation)}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Observações do encarregado
                    </p>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {view.notes || "Sem observações."}
                    </p>
                  </div>

                  {consultation.triageObservations && !isGuardian ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Observações da triagem
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {consultation.triageObservations}
                      </p>
                      {consultation.triageOutcome ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Seguimento: {triageOutcomeLabels[consultation.triageOutcome]}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {consultation.assignmentNote ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Nota administrativa
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {consultation.assignmentNote}
                      </p>
                    </div>
                  ) : null}

                  {consultation.schedulingNotes ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Observações do agendamento
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {consultation.schedulingNotes}
                      </p>
                    </div>
                  ) : null}

                  {consultation.cancelReason ? (
                    <div className="mt-5 border-t border-border pt-5">
                      <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        Motivo do cancelamento
                      </p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">
                        {consultation.cancelReason}
                      </p>
                    </div>
                  ) : null}

                  {/* Consentimento do encarregado (§4) */}
                  <div className="mt-5 flex gap-3 border-t border-border pt-5">
                    <ShieldCheck
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-success"
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {consultation.consentGivenAt
                        ? `Consentimento do encarregado de educação registado em ${formatDateTime(consultation.consentGivenAt)}. A teleconsulta não é gravada automaticamente.`
                        : "Falta o consentimento do encarregado de educação para a realização da teleconsulta."}
                    </p>
                  </div>
                </section>

                {/* Acesso à sala */}
                {consultation.channel === "VIDEO" && showClinical ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Acesso à sala</h2>

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
                            ? "A teleconsulta foi encerrada — o acesso deixou de ser válido."
                            : linkValid
                              ? `Válido até às ${formatTime(
                                  consultation.meetingLinkExpiresAt!,
                                )} — ${MEETING_LINK_GRACE_MINUTES} minutos após a hora marcada.`
                              : "Este acesso expirou. Disponibilize um novo acesso para abrir uma nova janela."}
                          {consultation.accessNotifiedAt
                            ? ` Notificação simulada enviada ${timeAgo(consultation.accessNotifiedAt).toLowerCase()}.`
                            : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        O acesso à sala é gerado quando o horário da teleconsulta
                        for definido.
                      </p>
                    )}

                    {mayWriteRecord && consultation.scheduledAt && !isClosed ? (
                      <Button
                        variant={linkExpired ? "default" : "outline"}
                        size="lg"
                        className="mt-4"
                        onClick={() =>
                          report(
                            resendRoomAccess(consultation.id, user.id),
                            `Novo acesso disponibilizado ao encarregado por notificação simulada. Válido durante mais ${MEETING_LINK_GRACE_MINUTES} minutos.`,
                          )
                        }
                      >
                        <Send data-icon="inline-start" />
                        Disponibilizar novo acesso
                      </Button>
                    ) : null}
                  </section>
                ) : null}

                {/* Auditoria dos acessos excepcionais */}
                {showClinical && consultation.accessLog?.length ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Acessos registados</h2>
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

              {/* Acções por perfil e fase */}
              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                {mayTriage ? (
                  <ActionCard
                    title="Triagem do pedido"
                    description="Este pedido aguarda triagem. Analise os sintomas, atribua a prioridade e registe as observações."
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setTab("triagem")}
                    >
                      <ClipboardCheck data-icon="inline-start" />
                      Realizar triagem
                    </Button>
                  </ActionCard>
                ) : null}

                {mayAssign ? (
                  <ActionCard
                    title="Atribuição"
                    description="Consulte a disponibilidade dos pediatras e atribua o pedido."
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setTab("atribuicao")}
                    >
                      <UserCheck data-icon="inline-start" />
                      {consultation.assignedDoctorId
                        ? "Reatribuir pediatra"
                        : "Atribuir pediatra"}
                    </Button>
                  </ActionCard>
                ) : null}

                {mayReview ? (
                  <ActionCard
                    title="Pedido atribuído a si"
                    description="Consulte os dados da triagem e confirme que analisou o pedido antes de definir o horário."
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (
                          report(
                            reviewRequest(consultation.id, user.id),
                            "Pedido analisado. Pode agora definir o horário do atendimento.",
                          )
                        ) {
                          setTab("agendamento");
                        }
                      }}
                    >
                      <Search data-icon="inline-start" />
                      Analisar pedido
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="mt-2 w-full"
                      onClick={() => setTab("triagem")}
                    >
                      Consultar triagem
                    </Button>
                  </ActionCard>
                ) : null}

                {maySchedule || mayReschedule ? (
                  <ActionCard
                    title={maySchedule ? "Horário por definir" : "Consulta agendada"}
                    description={
                      maySchedule
                        ? "Escolha a data, a hora, a duração prevista, a modalidade e as observações."
                        : `Marcada para ${formatDateTime(consultation.scheduledAt!)}.`
                    }
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setTab("agendamento")}
                    >
                      <CalendarClock data-icon="inline-start" />
                      {maySchedule ? "Definir horário" : "Actualizar agendamento"}
                    </Button>
                  </ActionCard>
                ) : null}

                {mayConduct ? (
                  consultation.status === "CONSULTA_AGENDADA" ? (
                    linkExpired ? (
                      <Alert variant="warning">
                        <Link2 />
                        <AlertTitle>Entrada bloqueada</AlertTitle>
                        <AlertDescription>
                          Disponibilize um novo acesso à sala para abrir uma nova
                          janela de entrada.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        size="xl"
                        className="w-full"
                        onClick={() => {
                          if (
                            report(
                              startConsultation(consultation.id, user.id),
                              "Teleconsulta iniciada. Entre na sala quando estiver pronto.",
                            )
                          ) {
                            setTab("sala");
                          }
                        }}
                      >
                        <Play data-icon="inline-start" />
                        Realizar consulta
                      </Button>
                    )
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

                {mayWriteRecord && isClosed ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setTab("registo")}
                  >
                    <FileText data-icon="inline-start" />
                    Consultar registo
                  </Button>
                ) : null}

                {/* Encaminhamento para presencial */}
                {mayWriteRecord && !isClosed ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">
                      Encaminhar para atendimento presencial
                    </h2>
                    <form onSubmit={handleRefer} className="mt-3 space-y-3">
                      <Textarea
                        rows={3}
                        required
                        aria-required="true"
                        value={referralReason}
                        onChange={(event) => {
                          setReferralReason(event.target.value);
                          clear();
                        }}
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

                {isRestricted ? (
                  <ActionCard
                    title="Acesso ao processo"
                    description="Só o pediatra responsável acede ao processo clínico completo. Se precisa de intervir neste caso, justifique o acesso."
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setAccessDialogOpen(true)}
                    >
                      <ShieldAlert data-icon="inline-start" />
                      Justificar acesso
                    </Button>
                  </ActionCard>
                ) : null}

                {/* Painel do encarregado */}
                {isGuardian ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">O seu pedido</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {guardianStatusMessage(consultation.status, consultation)}
                    </p>

                    {roomOpen ? (
                      <Button
                        size="lg"
                        className="mt-4 w-full"
                        onClick={() => setTab("sala")}
                      >
                        <MessageSquare data-icon="inline-start" />
                        Entrar na consulta
                      </Button>
                    ) : null}

                    {consultation.status === "CONSULTA_AGENDADA" ? (
                      <form onSubmit={handleChangeRequest} className="mt-4 space-y-2.5">
                        <Label
                          htmlFor="change-reason"
                          className="text-sm font-semibold"
                        >
                          Pedir alteração do horário
                        </Label>
                        <Textarea
                          id="change-reason"
                          rows={3}
                          required
                          aria-required="true"
                          minLength={10}
                          value={changeReason}
                          onChange={(event) => {
                            setChangeReason(event.target.value);
                            clear();
                          }}
                          placeholder="Explique porque precisa de outro horário…"
                          className="rounded-xl"
                        />
                        <Button type="submit" variant="outline" size="lg" className="w-full">
                          <CalendarClock data-icon="inline-start" />
                          Enviar pedido de alteração
                        </Button>
                      </form>
                    ) : null}

                    {linkExpired && !isClosed ? (
                      <Alert variant="warning" className="mt-4">
                        <Link2 />
                        <AlertDescription>
                          O acesso a esta sala expirou. O pediatra responsável pode
                          disponibilizar um novo acesso.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </section>
                ) : null}

                {/* Cancelamento */}
                {mayCancel ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">Cancelar pedido</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      O pedido passa ao estado «Cancelado» e o registo fica
                      preservado no histórico.
                    </p>
                    <form onSubmit={handleCancel} className="mt-3 space-y-2.5">
                      <Textarea
                        rows={2}
                        value={cancelReason}
                        onChange={(event) => {
                          setCancelReason(event.target.value);
                          clear();
                        }}
                        placeholder="Motivo do cancelamento (opcional)"
                        aria-label="Motivo do cancelamento"
                        className="rounded-xl"
                      />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="lg"
                        className="w-full"
                      >
                        <Trash2 data-icon="inline-start" />
                        Cancelar pedido
                      </Button>
                    </form>
                  </section>
                ) : null}
              </aside>
            </div>
          </TabsContent>

          {/* --- Triagem --- */}
          {showTriageTab ? (
            <TabsContent value="triagem" className="mt-5">
              <div className="max-w-4xl">
                <TriagePanel consultation={consultation} viewer={user} />
              </div>
            </TabsContent>
          ) : null}

          {/* --- Atribuição --- */}
          {showAssignmentTab ? (
            <TabsContent value="atribuicao" className="mt-5">
              <div className="max-w-4xl">
                <AssignmentPanel consultation={consultation} viewer={user} />
              </div>
            </TabsContent>
          ) : null}

          {/* --- Agendamento --- */}
          {showSchedulingTab ? (
            <TabsContent value="agendamento" className="mt-5">
              <div className="max-w-4xl">
                <SchedulingPanel consultation={consultation} viewer={user} />
              </div>
            </TabsContent>
          ) : null}

          {/* --- Sala --- */}
          <TabsContent value="sala" className="mt-5">
            {roomOpen ? (
              <ConsultationRoom
                consultation={consultation}
                viewer={user}
                onEnded={() => {
                  if (mayWriteRecord) {
                    setTab("registo");
                    showOk(
                      "Chamada encerrada. Registe a orientação clínica para concluir a consulta.",
                    );
                  }
                }}
              />
            ) : (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <EmptyState
                  icon={<Link2 className="size-5" />}
                  title="Sala indisponível"
                  description="A sala abre quando a teleconsulta estiver agendada e o acesso válido. Só o encarregado da criança e o pediatra responsável entram na consulta."
                />
              </div>
            )}
          </TabsContent>

          {/* --- Registo clínico e prescrição --- */}
          {showRecordTab ? (
            <TabsContent value="registo" className="mt-5">
              <div className="max-w-4xl space-y-6">
                {/* Resultado já registado */}
                {showClinical &&
                (consultation.clinicalNotes ||
                  consultation.guidance ||
                  consultation.referralReason) ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">
                      Resultado da consulta
                    </h2>

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
                          Orientação clínica
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

                {/* Prescrição */}
                {showPrescription ? (
                  <PrescriptionPanel
                    consultation={consultation}
                    viewer={user}
                    readOnly={isGuardian}
                  />
                ) : null}

                {/* Encerramento da consulta */}
                {mayWriteRecord && !isClosed ? (
                  <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                    <h2 className="font-bold tracking-tight">
                      Encerrar teleconsulta
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      As notas ficam no histórico clínico da criança; a orientação é
                      partilhada com o encarregado de educação.
                    </p>

                    <form onSubmit={handleComplete} className="mt-5 space-y-4">
                      <div>
                        <Label
                          htmlFor="clinical-notes"
                          className="text-sm font-semibold"
                        >
                          Notas clínicas
                        </Label>
                        <Textarea
                          id="clinical-notes"
                          rows={4}
                          value={clinicalNotes || consultation.clinicalNotes}
                          onChange={(event) => {
                            setClinicalNotes(event.target.value);
                            clear();
                          }}
                          placeholder="Avaliação do pedido, sinais observados, hipóteses consideradas…"
                          className="mt-2 rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="guidance" className="text-sm font-semibold">
                          Orientação para o encarregado
                          <span aria-hidden className="ml-0.5 text-destructive">
                            *
                          </span>
                        </Label>
                        <Textarea
                          id="guidance"
                          rows={4}
                          required
                          aria-required="true"
                          value={guidance || consultation.guidance}
                          onChange={(event) => {
                            setGuidance(event.target.value);
                            clear();
                          }}
                          placeholder="Cuidados em casa, sinais de alarme, reavaliação…"
                          className="mt-2 rounded-xl"
                        />
                      </div>

                      <Button type="submit" size="xl">
                        <CheckCircle2 data-icon="inline-start" />
                        Concluir teleconsulta
                      </Button>
                    </form>
                  </section>
                ) : null}

                {isGuardian && !consultation.guidance ? (
                  <Alert variant="info">
                    <AlertCircle />
                    <AlertDescription>
                      A orientação clínica fica disponível aqui depois de o pediatra
                      concluir a teleconsulta.
                    </AlertDescription>
                  </Alert>
                ) : null}
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

          {/* --- Percurso --- */}
          <TabsContent value="percurso" className="mt-5">
            <RequestTimeline consultation={consultation} />
          </TabsContent>
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
                <SelectTrigger
                  id="access-reason"
                  className="mt-2 h-11 w-full rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(accessReasonLabels) as AccessReason[]).map(
                    (reason) => (
                      <SelectItem key={reason} value={reason}>
                        {accessReasonLabels[reason]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="access-note" className="text-sm font-semibold">
                Nota{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
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

/** Mensagem de acompanhamento apresentada ao encarregado em cada estado. */
function guardianStatusMessage(
  status: string,
  consultation: { assignedDoctorName: string | null; scheduledAt: string | null },
) {
  switch (status) {
    case "SUBMETIDO":
    case "AGUARDA_TRIAGEM":
      return "O pedido foi recebido e está a aguardar triagem por um profissional de saúde do HGM.";
    case "TRIAGEM_CONCLUIDA":
    case "AGUARDA_ATRIBUICAO":
      return "A triagem está concluída. O HGM está a atribuir o pedido a um pediatra.";
    case "PEDIATRA_ATRIBUIDO":
      return `O pedido foi atribuído a ${consultation.assignedDoctorName}. Vai receber a informação do agendamento.`;
    case "AGUARDA_AGENDAMENTO":
      return `${consultation.assignedDoctorName} está a definir o horário do atendimento.`;
    case "CONSULTA_AGENDADA":
      return `Teleconsulta marcada para ${formatDateTime(consultation.scheduledAt!)} com ${consultation.assignedDoctorName}.`;
    case "CONSULTA_EM_CURSO":
      return "A teleconsulta está a decorrer. Entre na consulta.";
    case "CONSULTA_CONCLUIDA":
      return "Consulta concluída. Consulte a orientação clínica e a prescrição no separador «Registo clínico».";
    case "ENCAMINHADO_PRESENCIAL":
      return "O pedido foi encaminhado para atendimento presencial. Dirija-se à unidade sanitária indicada.";
    default:
      return "O pedido foi cancelado.";
  }
}

function ActionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
      <h2 className="font-bold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
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

"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Hospital,
  Info,
  RefreshCcw,
} from "lucide-react";

import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import type {
  Consultation,
  ConsultationPriority,
  TriageOutcome,
} from "@/lib/types/consultation";
import {
  assignablePriorities,
  priorityLabels,
  triageOutcomeLabels,
} from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { canReviewPriority, canTriage } from "@/lib/auth/access";
import { symptomText } from "@/lib/utils/consultations";
import { formatDateTime } from "@/lib/utils/date";
import { screenIntake } from "@/lib/utils/intake";
import { cn } from "@/lib/utils";

/**
 * Triagem e classificação preliminar (§2 do relatório).
 *
 * A plataforma não tria: o profissional de triagem analisa os sintomas e as
 * informações submetidas, atribui a prioridade, regista observações, justifica
 * alterações e decide entre autorizar a continuidade para teleconsulta ou
 * encaminhar para atendimento presencial.
 *
 * O aviso sobre sintomas potencialmente graves é apresentado apenas como aviso
 * preventivo — nunca como triagem ou diagnóstico.
 */
export function TriagePanel({
  consultation,
  viewer,
}: {
  consultation: Consultation;
  viewer: User;
}) {
  const concludeTriage = useClinicStore((state) => state.concludeTriage);
  const reviewPriority = useClinicStore((state) => state.reviewPriority);
  const { feedback, report, clear } = useFeedback();

  const [priority, setPriority] = useState<ConsultationPriority>("NORMAL");
  const [observations, setObservations] = useState("");
  const [outcome, setOutcome] = useState<TriageOutcome>("TELECONSULTA");
  const [referralReason, setReferralReason] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [newPriority, setNewPriority] = useState<ConsultationPriority>("URGENTE");
  const [justification, setJustification] = useState("");

  const screening = screenIntake({
    symptoms: consultation.symptoms,
    otherSymptom: consultation.otherSymptom,
  });

  const canDoTriage = canTriage(viewer, consultation);
  const canReview = canReviewPriority(viewer, consultation);

  function handleConclude(event: React.FormEvent) {
    event.preventDefault();

    const result = concludeTriage(consultation.id, {
      professionalId: viewer.id,
      priority,
      observations,
      outcome,
      referralReason: outcome === "PRESENCIAL" ? referralReason : undefined,
    });

    report(
      result,
      outcome === "PRESENCIAL"
        ? "Triagem concluída e pedido encaminhado para atendimento presencial."
        : "Triagem concluída. O pedido segue para atribuição de um pediatra.",
    );
  }

  function handleReview(event: React.FormEvent) {
    event.preventDefault();

    const result = reviewPriority(consultation.id, {
      professionalId: viewer.id,
      priority: newPriority,
      justification,
    });

    if (report(result, "Prioridade alterada e justificação registada.")) {
      setReviewOpen(false);
      setJustification("");
    }
  }

  return (
    <div className="space-y-5">
      <FeedbackAlert feedback={feedback} />

      {/* O que foi submetido — a matéria-prima da triagem */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
        <h2 className="font-bold tracking-tight">Informações submetidas</h2>

        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Sintomas indicados
            </dt>
            <dd className="mt-1.5 leading-relaxed">{symptomText(consultation)}</dd>
          </div>

          <div>
            <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Observações do encarregado
            </dt>
            <dd className="mt-1.5 leading-relaxed text-muted-foreground">
              {consultation.notes || "Sem observações."}
            </dd>
          </div>

          <div>
            <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Idade da criança
            </dt>
            <dd className="mt-1.5">{consultation.childAgeYears} anos</dd>
          </div>
        </dl>

        {screening.showWarning ? (
          <Alert variant="warning" className="mt-5">
            <AlertTriangle />
            <AlertTitle>Aviso preventivo</AlertTitle>
            <AlertDescription>
              O pedido menciona {screening.matched.join(", ").toLowerCase()}. Este
              aviso é apenas preventivo: não constitui triagem nem diagnóstico e
              não atribui qualquer prioridade ao pedido.
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

      {/* Triagem já concluída */}
      {consultation.triagedAt ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold tracking-tight">Triagem</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Concluída por {consultation.triageProfessionalName} em{" "}
                {formatDateTime(consultation.triagedAt)}.
              </p>
            </div>
            <PriorityBadge priority={consultation.priority} />
          </div>

          <dl className="mt-4 space-y-4 border-t border-border pt-4">
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Observações da triagem
              </dt>
              <dd className="mt-1.5 leading-relaxed">
                {consultation.triageObservations || "Sem observações."}
              </dd>
            </div>

            {consultation.triageOutcome ? (
              <div>
                <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                  Seguimento
                </dt>
                <dd className="mt-1.5">
                  {triageOutcomeLabels[consultation.triageOutcome]}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Alterações de prioridade, sempre justificadas */}
          {consultation.priorityHistory.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Alterações de prioridade
              </p>
              <ul className="mt-3 space-y-3">
                {consultation.priorityHistory.map((change) => (
                  <li
                    key={change.id}
                    className="border-l-2 border-border pl-3.5 text-sm"
                  >
                    <p className="font-medium">
                      {priorityLabels[change.from]} → {priorityLabels[change.to]}
                    </p>
                    <p className="text-muted-foreground">
                      {change.byName} · {formatDateTime(change.at)}
                    </p>
                    <p className="mt-0.5 leading-relaxed text-muted-foreground">
                      {change.justification}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {canReview ? (
            <div className="mt-5 border-t border-border pt-4">
              {reviewOpen ? (
                <form onSubmit={handleReview} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="review-priority"
                      className="text-sm font-semibold"
                    >
                      Nova prioridade
                    </Label>
                    <Select
                      value={newPriority}
                      onValueChange={(value) => {
                        setNewPriority(value as ConsultationPriority);
                        clear();
                      }}
                    >
                      <SelectTrigger
                        id="review-priority"
                        className="mt-2 h-11 w-full rounded-xl"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignablePriorities.map((item) => (
                          <SelectItem key={item} value={item}>
                            {priorityLabels[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="review-justification"
                      className="text-sm font-semibold"
                    >
                      Justificação da alteração
                    </Label>
                    <Textarea
                      id="review-justification"
                      rows={3}
                      required
                      aria-required="true"
                      value={justification}
                      onChange={(event) => {
                        setJustification(event.target.value);
                        clear();
                      }}
                      placeholder="Explique o que mudou na avaliação do caso…"
                      className="mt-2 rounded-xl"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Qualquer alteração de prioridade tem de ser justificada e
                      fica registada com o seu nome.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="lg">
                      Guardar alteração
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setReviewOpen(false);
                        clear();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setReviewOpen(true)}
                >
                  <RefreshCcw data-icon="inline-start" />
                  Confirmar ou alterar prioridade
                </Button>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Formulário de triagem — exclusivo do profissional de triagem */}
      {canDoTriage ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <h2 className="font-bold tracking-tight">Realizar triagem</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Analise os sintomas submetidos, atribua a prioridade e registe as
            observações. A plataforma não classifica pedidos automaticamente.
          </p>

          <form onSubmit={handleConclude} className="mt-5 space-y-5">
            <div>
              <Label className="text-sm font-semibold">Prioridade atribuída</Label>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                {assignablePriorities.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={priority === item}
                    onClick={() => {
                      setPriority(item);
                      clear();
                    }}
                    className={cn(
                      "rounded-xl px-3.5 py-3 text-sm font-medium ring-1 transition-all",
                      priority === item
                        ? "bg-primary-soft ring-primary"
                        : "bg-background text-muted-foreground ring-border hover:ring-primary/40",
                    )}
                  >
                    {priorityLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="triage-observations" className="text-sm font-semibold">
                Observações da triagem
                <span aria-hidden className="ml-0.5 text-destructive">
                  *
                </span>
              </Label>
              <Textarea
                id="triage-observations"
                rows={4}
                required
                aria-required="true"
                minLength={10}
                value={observations}
                onChange={(event) => {
                  setObservations(event.target.value);
                  clear();
                }}
                placeholder="O que observou nas informações submetidas, o que justifica a prioridade atribuída, contactos feitos com o encarregado…"
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Seguimento do pedido</Label>
              <div className="mt-2 grid gap-2.5">
                {(["TELECONSULTA", "PRESENCIAL"] as TriageOutcome[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={outcome === item}
                    onClick={() => {
                      setOutcome(item);
                      clear();
                    }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all",
                      outcome === item
                        ? "bg-primary-soft ring-primary"
                        : "bg-background ring-border hover:ring-primary/40",
                    )}
                  >
                    {item === "TELECONSULTA" ? (
                      <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    ) : (
                      <Hospital className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span>
                      <span className="block text-sm font-semibold">
                        {triageOutcomeLabels[item]}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item === "TELECONSULTA"
                          ? "O pedido segue para o perfil administrativo atribuir um pediatra."
                          : "O pedido é encerrado na plataforma e a família é orientada para a unidade sanitária."}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {outcome === "PRESENCIAL" ? (
              <div>
                <Label htmlFor="triage-referral" className="text-sm font-semibold">
                  Motivo do encaminhamento
                  <span aria-hidden className="ml-0.5 text-destructive">
                    *
                  </span>
                </Label>
                <Textarea
                  id="triage-referral"
                  rows={3}
                  required
                  aria-required="true"
                  value={referralReason}
                  onChange={(event) => {
                    setReferralReason(event.target.value);
                    clear();
                  }}
                  placeholder="Motivo clínico do encaminhamento para atendimento presencial…"
                  className="mt-2 rounded-xl"
                />
              </div>
            ) : null}

            <Alert variant="info">
              <Info />
              <AlertDescription>
                A triagem é um acto profissional registado: o seu nome, a
                prioridade atribuída e as observações ficam associados ao pedido.
              </AlertDescription>
            </Alert>

            <Button type="submit" size="xl" className="w-full sm:w-auto">
              <ClipboardCheck data-icon="inline-start" />
              Concluir triagem
            </Button>
          </form>
        </section>
      ) : null}

      {!canDoTriage && !consultation.triagedAt ? (
        <Alert variant="info">
          <Info />
          <AlertTitle>Aguardando triagem</AlertTitle>
          <AlertDescription>
            Este pedido está à espera de ser analisado por um profissional de
            triagem do HGM, que atribui a prioridade e define o seguimento.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

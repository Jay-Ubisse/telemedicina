"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Baby,
  CheckCircle2,
  Info,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";

import { NeighbourhoodField, resolveNeighbourhood, splitNeighbourhood } from "@/components/forms/neighbourhood-field";
import { AppHeader } from "@/components/layout/app-header";
import { EmergencyNotice } from "@/components/layout/emergency-notice";
import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { AvailabilityBadge } from "@/components/telemedicine/availability-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { symptomCatalogue } from "@/lib/data/symptoms";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useAvailability, usePediatricians } from "@/lib/store/selectors";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { rankDoctorsByAvailability } from "@/lib/utils/availability";
import { describeAge } from "@/lib/utils/date";
import { screenIntake } from "@/lib/utils/intake";
import { cn } from "@/lib/utils";

const channels: {
  value: ConsultationChannel;
  label: string;
  hint: string;
  icon: typeof Video;
}[] = [
  {
    value: "VIDEO",
    label: "Videochamada",
    hint: "Recebe o acesso à sala depois do agendamento",
    icon: Video,
  },
  {
    value: "AUDIO",
    label: "Chamada de áudio",
    hint: "O pediatra liga para o seu número",
    icon: Phone,
  },
  {
    value: "TEXTO",
    label: "Mensagens de texto",
    hint: "Atendimento por escrito, sem chamada",
    icon: MessageSquare,
  },
];

/**
 * Pedido de teleconsulta.
 *
 * Saiu daqui a «triagem estimada»: a plataforma não classifica pedidos (§2 do
 * relatório). Quando os sintomas indicados podem exigir atendimento imediato,
 * aparece um aviso **preventivo**, identificado como tal.
 *
 * Entraram a indicação de um pediatra de preferência (§7), sujeita à
 * disponibilidade, e o consentimento explícito do encarregado de educação (§4).
 */
export default function NovoPedidoPage() {
  const user = useSession();
  const searchParams = useSearchParams();

  const children = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id && !child.archived,
  );
  const createConsultation = useClinicStore((state) => state.createConsultation);
  const pediatricians = usePediatricians();
  const availability = useAvailability();
  const { feedback, showError, clear } = useFeedback();

  const initialAddress = splitNeighbourhood(user.address);

  const [childId, setChildId] = useState(
    searchParams.get("crianca") ?? children[0]?.id ?? "",
  );
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [channel, setChannel] = useState<ConsultationChannel>("VIDEO");
  const [location, setLocation] = useState(initialAddress.value);
  const [locationOther, setLocationOther] = useState(initialAddress.customValue);
  const [notes, setNotes] = useState("");
  const [preferredDoctorId, setPreferredDoctorId] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState<{
    reference: string;
    message: string;
    id: string;
  } | null>(null);

  const screening = useMemo(
    () => screenIntake({ symptoms, otherSymptom }),
    [symptoms, otherSymptom],
  );

  const ranked = useMemo(
    () => rankDoctorsByAvailability(pediatricians, availability),
    [pediatricians, availability],
  );

  const hasSelection = symptoms.length > 0 || otherSymptom.trim() !== "";
  const resolvedLocation = resolveNeighbourhood(location, locationOther);

  function toggleSymptom(symptom: string, checked: boolean) {
    clear();
    setSymptoms((current) =>
      checked ? [...current, symptom] : current.filter((item) => item !== symptom),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clear();

    const result = createConsultation({
      childId,
      guardianId: user.id,
      phone: user.phone,
      location: resolvedLocation,
      symptoms,
      otherSymptom,
      notes,
      channel,
      source: "WEB",
      preferredDoctorId: preferredDoctorId || null,
      consent,
    });

    if (!result.ok) {
      showError(result.error);
      return;
    }

    setSuccess({
      reference: result.data.consultation.reference,
      message: result.data.message,
      id: result.data.consultation.id,
    });
  }

  if (children.length === 0) {
    return (
      <>
        <AppHeader user={user} title="Nova teleconsulta" />
        <PageShell>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <EmptyState
              icon={<Baby className="size-5" />}
              title="Registe primeiro uma criança"
              description="Os pedidos de teleconsulta são sempre associados a uma criança registada na sua conta."
              action={
                <Button asChild size="lg">
                  <Link href="/criancas">Registar criança</Link>
                </Button>
              }
            />
          </div>
        </PageShell>
      </>
    );
  }

  if (success) {
    return (
      <>
        <AppHeader user={user} title="Pedido submetido" />
        <PageShell>
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/8 sm:p-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/12 text-success">
                <CheckCircle2 className="size-6" />
              </span>

              <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
                Pedido submetido
              </h2>

              <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted-foreground">
                {success.message}
              </p>

              <p className="mt-5 text-sm font-semibold">
                Referência {success.reference}
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="xl">
                  <Link href={`/teleconsultas/${success.id}`}>
                    Acompanhar pedido
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="/inicio">Voltar ao início</Link>
                </Button>
              </div>
            </div>

            {screening.showWarning ? (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>Aviso preventivo</AlertTitle>
                <AlertDescription>{screening.warning}</AlertDescription>
              </Alert>
            ) : null}

            <EmergencyNotice />
          </div>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader
        user={user}
        title="Nova teleconsulta"
        subtitle="Descreva os sintomas. O pedido é analisado por um profissional de triagem do HGM."
      />

      <PageShell>
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <div className="space-y-6">
            <FeedbackAlert feedback={feedback} />

            {/* Criança */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Criança</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Cada pedido diz respeito a uma criança específica.
              </p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setChildId(child.id);
                      clear();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all",
                      childId === child.id
                        ? "bg-primary-soft ring-primary"
                        : "bg-background ring-border hover:ring-primary/40",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-foreground">
                      {child.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {child.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {describeAge(child.birthDate)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Sintomas — lista plana, sem níveis de gravidade */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Sintomas</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Seleccione tudo o que se aplica. A classificação do pedido é feita
                por um profissional de saúde, não pela plataforma.
              </p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {symptomCatalogue.map((symptom) => {
                  const id = `symptom-${symptom}`;
                  const checked = symptoms.includes(symptom);

                  return (
                    <label
                      key={symptom}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 transition-colors",
                        checked
                          ? "bg-primary-soft ring-primary/40"
                          : "bg-background ring-border hover:ring-primary/25",
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(state) =>
                          toggleSymptom(symptom, Boolean(state))
                        }
                      />
                      {symptom}
                    </label>
                  );
                })}
              </div>

              <div className="mt-5">
                <Label htmlFor="other-symptom" className="text-sm font-semibold">
                  Outro sintoma
                </Label>
                <Input
                  id="other-symptom"
                  value={otherSymptom}
                  onChange={(event) => {
                    setOtherSymptom(event.target.value);
                    clear();
                  }}
                  placeholder="Descreva por palavras suas"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              {/* Aviso preventivo — não é triagem nem diagnóstico */}
              {screening.showWarning ? (
                <Alert variant="warning" className="mt-5">
                  <AlertTriangle />
                  <AlertTitle>Aviso preventivo</AlertTitle>
                  <AlertDescription>{screening.warning}</AlertDescription>
                </Alert>
              ) : null}
            </section>

            {/* Atendimento */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Atendimento</h2>

              <div className="mt-4 space-y-5">
                <div>
                  <Label className="text-sm font-semibold">
                    Modalidade preferida
                  </Label>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                    {channels.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setChannel(option.value)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all",
                          channel === option.value
                            ? "bg-primary-soft ring-primary"
                            : "bg-background ring-border hover:ring-primary/40",
                        )}
                      >
                        <option.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          <span className="block text-sm font-semibold">
                            {option.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <NeighbourhoodField
                  id="location"
                  value={location}
                  customValue={locationOther}
                  onChange={(value) => {
                    setLocation(value);
                    clear();
                  }}
                  onCustomChange={(value) => {
                    setLocationOther(value);
                    clear();
                  }}
                />

                {/* Pediatra de preferência (§7) */}
                <div>
                  <Label className="text-sm font-semibold">
                    Pediatra de preferência{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </Label>

                  <div className="mt-2 grid gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPreferredDoctorId("")}
                      className={cn(
                        "rounded-xl px-3.5 py-3 text-left text-sm ring-1 transition-all",
                        preferredDoctorId === ""
                          ? "bg-primary-soft ring-primary"
                          : "bg-background ring-border hover:ring-primary/40",
                      )}
                    >
                      <span className="font-semibold">Sem preferência</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        O HGM atribui o pediatra disponível mais indicado.
                      </span>
                    </button>

                    {ranked.map((entry) => (
                      <button
                        key={entry.doctor.id}
                        type="button"
                        onClick={() => setPreferredDoctorId(entry.doctor.id)}
                        className={cn(
                          "flex flex-wrap items-start justify-between gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all",
                          preferredDoctorId === entry.doctor.id
                            ? "bg-primary-soft ring-primary"
                            : "bg-background ring-border hover:ring-primary/40",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {entry.doctor.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {entry.doctor.specialty ?? "Pediatria"}
                          </span>
                        </span>
                        <AvailabilityBadge status={entry.status} />
                      </button>
                    ))}
                  </div>

                  <Alert variant="info" className="mt-3">
                    <Info />
                    <AlertDescription>
                      A preferência fica sujeita à disponibilidade e não garante
                      atendimento pelo profissional selecionado. Se estiver
                      indisponível, o sistema pode sugerir outro pediatra ou
                      permitir aguardar uma data disponível.
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    Observações{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      clear();
                    }}
                    placeholder="Há quanto tempo começaram os sintomas, temperatura medida, medicação já dada…"
                    className="mt-2 rounded-xl"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Submissão */}
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Submeter pedido</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Depois de submetido, o pedido fica no estado «Aguardando triagem»
                até ser analisado por um profissional de saúde do HGM, que define a
                prioridade e o seguimento.
              </p>

              {/* Consentimento do encarregado (§4) */}
              <label
                htmlFor="consent"
                className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-muted/50 p-3.5"
              >
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(state) => {
                    setConsent(Boolean(state));
                    clear();
                  }}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Autorizo, como encarregado de educação, a realização da
                  teleconsulta pediátrica e o tratamento dos dados clínicos
                  necessários ao atendimento. A consulta não é gravada
                  automaticamente.
                </span>
              </label>

              <Button
                type="submit"
                size="xl"
                className="mt-5 w-full shadow-md shadow-primary/20"
                disabled={
                  !hasSelection || !childId || !resolvedLocation || !consent
                }
              >
                Submeter pedido
                <ArrowRight data-icon="inline-end" />
              </Button>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Só é possível ter um pedido em aberto por criança de cada vez.
              </p>
            </div>

            <EmergencyNotice />
          </aside>
        </form>
      </PageShell>
    </>
  );
}

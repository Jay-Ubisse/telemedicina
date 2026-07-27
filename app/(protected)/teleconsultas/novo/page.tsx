"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Baby,
  CheckCircle2,
  Info,
  Phone,
  Video,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  criticalSymptoms,
  mildSymptoms,
  urgentSymptoms,
} from "@/lib/data/symptoms";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { priorityLabels } from "@/lib/types/consultation";
import { describeAge } from "@/lib/utils/date";
import { triage } from "@/lib/utils/triage";
import { cn } from "@/lib/utils";

const symptomGroups = [
  { title: "Sintomas leves", items: mildSymptoms as readonly string[] },
  { title: "Sintomas urgentes", items: urgentSymptoms as readonly string[] },
  { title: "Sintomas críticos", items: criticalSymptoms as readonly string[] },
];

export default function NovoPedidoPage() {
  const user = useSession();
  const searchParams = useSearchParams();

  const children = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id,
  );
  const createConsultation = useClinicStore((state) => state.createConsultation);

  const [childId, setChildId] = useState(
    searchParams.get("crianca") ?? children[0]?.id ?? "",
  );
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [channel, setChannel] = useState<ConsultationChannel>("VIDEO");
  const [location, setLocation] = useState(user.address ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    message: string;
    isEmergency: boolean;
    id: string;
  } | null>(null);

  const preview = useMemo(
    () => triage({ symptoms, otherSymptom }),
    [symptoms, otherSymptom],
  );

  const hasSelection = symptoms.length > 0 || otherSymptom.trim() !== "";

  function toggleSymptom(symptom: string, checked: boolean) {
    setError(null);
    setSymptoms((current) =>
      checked
        ? [...current, symptom]
        : current.filter((item) => item !== symptom),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = createConsultation({
      childId,
      guardianId: user.id,
      phone: user.phone,
      location,
      symptoms,
      otherSymptom,
      notes,
      channel,
      source: "WEB",
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess({
      reference: result.data.consultation.reference,
      message: result.data.message,
      isEmergency: result.data.isEmergency,
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
              title="Cadastre primeiro uma criança"
              description="Os pedidos de teleconsulta são sempre associados a uma criança registada na sua conta."
              action={
                <Button asChild size="lg">
                  <Link href="/criancas">Cadastrar criança</Link>
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
          <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/8 sm:p-10">
            <span
              className={cn(
                "mx-auto flex size-14 items-center justify-center rounded-2xl",
                success.isEmergency
                  ? "bg-destructive/12 text-destructive"
                  : "bg-success/12 text-success",
              )}
            >
              {success.isEmergency ? (
                <AlertTriangle className="size-6" />
              ) : (
                <CheckCircle2 className="size-6" />
              )}
            </span>

            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
              {success.isEmergency
                ? "Emergência detectada"
                : "Pedido registado com sucesso"}
            </h2>

            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted-foreground">
              {success.message}
            </p>

            <p className="mt-5 font-mono text-sm font-semibold">
              Referência {success.reference}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link href={`/teleconsultas/${success.id}`}>
                  Ver pedido
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/inicio">Voltar ao início</Link>
              </Button>
            </div>
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
        subtitle="Descreva os sintomas para a equipa do HGM avaliar o pedido."
      />

      <PageShell>
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <div className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

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
                      setError(null);
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

            {/* Sintomas */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Sintomas</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Seleccione tudo o que se aplica. A triagem é automática.
              </p>

              <div className="mt-5 space-y-6">
                {symptomGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      {group.title}
                    </p>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((symptom) => {
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
                  </div>
                ))}

                <div>
                  <Label htmlFor="other-symptom" className="text-sm font-semibold">
                    Outro sintoma
                  </Label>
                  <Input
                    id="other-symptom"
                    value={otherSymptom}
                    onChange={(event) => {
                      setOtherSymptom(event.target.value);
                      setError(null);
                    }}
                    placeholder="Descreva por palavras suas"
                    className="mt-2 h-11 rounded-xl px-3.5"
                  />
                </div>
              </div>
            </section>

            {/* Canal e contexto */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Atendimento</h2>

              <div className="mt-4 space-y-5">
                <div>
                  <Label className="text-sm font-semibold">Canal</Label>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                    {(
                      [
                        {
                          value: "VIDEO",
                          label: "Videochamada",
                          hint: "Recebe o link por SMS após o agendamento",
                          icon: Video,
                        },
                        {
                          value: "VOZ",
                          label: "Chamada de voz",
                          hint: "O pediatra liga para o seu número",
                          icon: Phone,
                        },
                      ] as const
                    ).map((option) => (
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

                <div>
                  <Label htmlFor="location" className="text-sm font-semibold">
                    Localização
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Bairro e avenida / rua"
                    className="mt-2 h-11 rounded-xl px-3.5"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    O serviço opera na cidade de Maputo.
                  </p>
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
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Há quanto tempo começaram os sintomas, temperatura medida, medicação já dada…"
                    className="mt-2 rounded-xl"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Pré-visualização da triagem */}
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Triagem estimada</h2>

              {!hasSelection ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Seleccione pelo menos um sintoma para ver a classificação.
                </p>
              ) : (
                <>
                  <p
                    className={cn(
                      "mt-3 text-lg font-extrabold tracking-tight",
                      preview.priority === "CRITICA"
                        ? "text-destructive"
                        : preview.priority === "URGENTE"
                          ? "text-warning-foreground"
                          : "text-primary",
                    )}
                  >
                    {priorityLabels[preview.priority]}
                  </p>

                  <Alert
                    variant={
                      preview.isEmergency
                        ? "destructive"
                        : preview.priority === "URGENTE"
                          ? "warning"
                          : "info"
                    }
                    className="mt-4"
                  >
                    {preview.isEmergency ? <AlertTriangle /> : <Info />}
                    {preview.isEmergency ? (
                      <AlertTitle>Possível emergência</AlertTitle>
                    ) : null}
                    <AlertDescription>{preview.message}</AlertDescription>
                  </Alert>
                </>
              )}

              <Button
                type="submit"
                size="xl"
                className="mt-5 w-full shadow-md shadow-primary/20"
                disabled={!hasSelection || !childId}
              >
                Submeter pedido
                <ArrowRight data-icon="inline-end" />
              </Button>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Só é possível ter um pedido em aberto por criança de cada vez.
              </p>
            </div>
          </aside>
        </form>
      </PageShell>
    </>
  );
}

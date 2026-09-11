"use client";

import { useState } from "react";
import { AlertTriangle, Info, Pencil, Pill, Plus, Trash2, X } from "lucide-react";

import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { EmptyState } from "@/components/layout/page-shell";
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
import { canWritePrescription } from "@/lib/auth/access";
import { useClinicStore } from "@/lib/store/clinic-store";
import type {
  Consultation,
  Prescription,
  PrescriptionRoute,
} from "@/lib/types/consultation";
import {
  PRESCRIPTION_DISCLAIMER,
  prescriptionRouteLabels,
} from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { formatDateTime } from "@/lib/utils/date";

type FormState = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: PrescriptionRoute;
  recommendations: string;
};

const emptyForm: FormState = {
  medication: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "ORAL",
  recommendations: "",
};

const routes = Object.keys(prescriptionRouteLabels) as PrescriptionRoute[];

/**
 * Secção «Prescrição» (§10 do relatório).
 *
 * Cada prescrição tem medicamento, dosagem, frequência, duração, via de
 * administração, recomendações, data e identificação do pediatra. Apenas o
 * pediatra responsável pode criar ou alterar; o encarregado da criança visualiza;
 * o perfil administrativo não cria, não altera, não elimina e não vê.
 *
 * Qualquer prescrição é acompanhada do aviso obrigatório de que se trata de uma
 * prescrição demonstrativa.
 */
export function PrescriptionPanel({
  consultation,
  viewer,
  readOnly = false,
}: {
  consultation: Consultation;
  viewer: User;
  /** Força a vista de leitura (ex.: encarregado). */
  readOnly?: boolean;
}) {
  const addPrescription = useClinicStore((state) => state.addPrescription);
  const updatePrescription = useClinicStore((state) => state.updatePrescription);
  const removePrescription = useClinicStore((state) => state.removePrescription);
  const { feedback, report, clear } = useFeedback();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const mayWrite = !readOnly && canWritePrescription(viewer, consultation);

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

  function openEdit(prescription: Prescription) {
    setEditing(prescription);
    setForm({
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      route: prescription.route,
      recommendations: prescription.recommendations,
    });
    setFormOpen(true);
    clear();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = editing
      ? updatePrescription(consultation.id, editing.id, viewer.id, form)
      : addPrescription(consultation.id, viewer.id, form);

    if (
      report(
        result,
        editing
          ? "Prescrição actualizada."
          : "Prescrição registada e disponibilizada ao encarregado.",
      )
    ) {
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
    }
  }

  function handleRemove(prescription: Prescription) {
    report(
      removePrescription(consultation.id, prescription.id, viewer.id),
      "Prescrição eliminada.",
    );
  }

  return (
    <div className="space-y-5">
      <FeedbackAlert feedback={feedback} />

      <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Pill className="size-4" />
            </span>
            <div>
              <h2 className="font-bold tracking-tight">Prescrição</h2>
              <p className="text-xs text-muted-foreground">
                {consultation.prescriptions.length === 0
                  ? "Sem prescrição registada"
                  : `${consultation.prescriptions.length} ${
                      consultation.prescriptions.length === 1
                        ? "medicamento"
                        : "medicamentos"
                    }`}
              </p>
            </div>
          </div>

          {mayWrite ? (
            <Button size="sm" onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Adicionar medicamento
            </Button>
          ) : null}
        </div>

        {consultation.prescriptions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Pill className="size-5" />}
              title="Sem prescrição"
              description={
                mayWrite
                  ? "Registe a prescrição demonstrativa desta teleconsulta: medicamento, dosagem, frequência, duração, via de administração e recomendações."
                  : "Quando o pediatra registar uma prescrição, ela aparece aqui."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {consultation.prescriptions.map((prescription) => (
              <li key={prescription.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{prescription.medication}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {prescription.doctorName}
                      {prescription.doctorLicenseNumber
                        ? ` · ${prescription.doctorLicenseNumber}`
                        : ""}{" "}
                      · {formatDateTime(prescription.issuedAt)}
                      {prescription.updatedAt
                        ? ` · alterada em ${formatDateTime(prescription.updatedAt)}`
                        : ""}
                    </p>
                  </div>

                  {mayWrite ? (
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Alterar prescrição de ${prescription.medication}`}
                        onClick={() => openEdit(prescription)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Eliminar prescrição de ${prescription.medication}`}
                        onClick={() => handleRemove(prescription)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Dosagem" value={prescription.dosage} />
                  <Field label="Frequência" value={prescription.frequency} />
                  <Field label="Duração" value={prescription.duration} />
                  <Field
                    label="Via de administração"
                    value={prescriptionRouteLabels[prescription.route]}
                  />
                </dl>

                {prescription.recommendations ? (
                  <div className="mt-3">
                    <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                      Recomendações
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {prescription.recommendations}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {/* Aviso obrigatório */}
        <div className="border-t border-border p-5">
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Prescrição demonstrativa</AlertTitle>
            <AlertDescription>{PRESCRIPTION_DISCLAIMER}</AlertDescription>
          </Alert>
        </div>
      </section>

      {formOpen && mayWrite ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold tracking-tight">
              {editing ? "Alterar prescrição" : "Nova prescrição"}
            </h3>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="prescription-medication" className="text-sm font-semibold">
                  Medicamento
                  <span aria-hidden className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="prescription-medication"
                  required
                  aria-required="true"
                  minLength={3}
                  value={form.medication}
                  onChange={(event) => update("medication", event.target.value)}
                  placeholder="Ex.: Paracetamol suspensão oral 120 mg/5 ml"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="prescription-dosage" className="text-sm font-semibold">
                  Dosagem
                  <span aria-hidden className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="prescription-dosage"
                  required
                  aria-required="true"
                  value={form.dosage}
                  onChange={(event) => update("dosage", event.target.value)}
                  placeholder="Ex.: 10 mg/kg por dose"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="prescription-frequency" className="text-sm font-semibold">
                  Frequência
                  <span aria-hidden className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="prescription-frequency"
                  required
                  aria-required="true"
                  value={form.frequency}
                  onChange={(event) => update("frequency", event.target.value)}
                  placeholder="Ex.: de 8 em 8 horas"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="prescription-duration" className="text-sm font-semibold">
                  Duração
                  <span aria-hidden className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="prescription-duration"
                  required
                  aria-required="true"
                  value={form.duration}
                  onChange={(event) => update("duration", event.target.value)}
                  placeholder="Ex.: 5 dias"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="prescription-route" className="text-sm font-semibold">
                  Via de administração
                </Label>
                <Select
                  value={form.route}
                  onValueChange={(value) =>
                    update("route", value as PrescriptionRoute)
                  }
                >
                  <SelectTrigger
                    id="prescription-route"
                    className="mt-2 h-11 w-full rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route} value={route}>
                        {prescriptionRouteLabels[route]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label
                  htmlFor="prescription-recommendations"
                  className="text-sm font-semibold"
                >
                  Recomendações{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="prescription-recommendations"
                  rows={3}
                  value={form.recommendations}
                  onChange={(event) =>
                    update("recommendations", event.target.value)
                  }
                  placeholder="Cuidados na administração, sinais de alarme, alergias conhecidas…"
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <Alert variant="info">
              <Info />
              <AlertDescription>
                A prescrição fica identificada com o seu nome e número da Ordem e é
                visível apenas para si e para o encarregado responsável por esta
                criança.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg">
                {editing ? "Guardar alterações" : "Registar prescrição"}
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Baby,
  CheckCircle2,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { MAX_AGE_YEARS } from "@/lib/data/symptoms";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { Child } from "@/lib/types/user";
import { openStatuses } from "@/lib/types/consultation";
import { describeAge, formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  birthDate: string;
  sex: "M" | "F" | "";
  notes: string;
};

const emptyForm: FormState = { name: "", birthDate: "", sex: "", notes: "" };

export default function CriancasPage() {
  const user = useSession();

  const children = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id,
  );
  const consultations = useClinicStore((state) => state.consultations);
  const addChild = useClinicStore((state) => state.addChild);
  const updateChild = useClinicStore((state) => state.updateChild);
  const removeChild = useClinicStore((state) => state.removeChild);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(child: Child) {
    setEditing(child);
    setForm({
      name: child.name,
      birthDate: child.birthDate,
      sex: child.sex,
      notes: child.notes ?? "",
    });
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.sex) {
      setError("Seleccione o sexo da criança.");
      return;
    }

    const payload = {
      name: form.name,
      birthDate: form.birthDate,
      sex: form.sex,
      notes: form.notes,
    };

    const result = editing
      ? updateChild(editing.id, payload)
      : addChild(user.id, payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setFeedback(
      editing
        ? `Dados de ${payload.name} actualizados.`
        : `${payload.name} foi cadastrado(a) com sucesso.`,
    );
    setDialogOpen(false);
    setForm(emptyForm);
    setEditing(null);
  }

  function handleRemove(child: Child) {
    const result = removeChild(child.id);
    setFeedback(result.ok ? `${child.name} foi removido(a).` : null);
    if (!result.ok) setError(result.error);
  }

  return (
    <>
      <AppHeader
        user={user}
        title="Crianças"
        subtitle="Educandos registados na sua conta."
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">Cadastrar criança</span>
          </Button>
        }
      />

      <PageShell>
        {feedback ? (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        ) : null}

        {error && !dialogOpen ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {children.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <EmptyState
              icon={<Baby className="size-5" />}
              title="Nenhuma criança registada"
              description={`Cadastre os seus educandos (0 aos ${MAX_AGE_YEARS} anos) para poder solicitar teleconsultas.`}
              action={
                <Button size="lg" onClick={openCreate}>
                  <Plus data-icon="inline-start" />
                  Cadastrar criança
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => {
              const openRequest = consultations.find(
                (item) =>
                  item.childId === child.id && openStatuses.includes(item.status),
              );
              const total = consultations.filter(
                (item) => item.childId === child.id,
              ).length;

              return (
                <article
                  key={child.id}
                  className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-foreground/8"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-base font-bold text-accent-foreground">
                      {child.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-bold tracking-tight">
                        {child.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {describeAge(child.birthDate)} ·{" "}
                        {child.sex === "M" ? "Masculino" : "Feminino"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Nascimento: {formatDate(child.birthDate)}
                      </p>
                    </div>
                  </div>

                  {child.notes ? (
                    <p className="mt-4 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                      {child.notes}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {total} pedido{total === 1 ? "" : "s"}
                    </span>
                    {openRequest ? (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-secondary-foreground">
                        {openRequest.reference} em aberto
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-border pt-4">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1"
                      disabled={Boolean(openRequest)}
                    >
                      <Link href={`/teleconsultas/novo?crianca=${child.id}`}>
                        <Stethoscope data-icon="inline-start" />
                        Solicitar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Editar ${child.name}`}
                      onClick={() => openEdit(child)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label={`Remover ${child.name}`}
                      onClick={() => handleRemove(child)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar criança" : "Cadastrar criança"}
            </DialogTitle>
            <DialogDescription>
              O serviço é exclusivo para crianças dos 0 aos {MAX_AGE_YEARS} anos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div>
              <Label htmlFor="child-name" className="text-sm font-semibold">
                Nome completo
              </Label>
              <Input
                id="child-name"
                name="child-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Tiago Mondlane"
                className="mt-2 h-11 rounded-xl px-3.5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="child-birth" className="text-sm font-semibold">
                  Data de nascimento
                </Label>
                <Input
                  id="child-birth"
                  name="child-birth"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthDate: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Sexo</Label>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { value: "M", label: "Masculino" },
                      { value: "F", label: "Feminino" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, sex: option.value }))
                      }
                      className={cn(
                        "h-11 flex-1 rounded-xl text-sm font-medium ring-1 transition-all",
                        form.sex === option.value
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-background text-muted-foreground ring-border hover:ring-primary/40",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="child-notes" className="text-sm font-semibold">
                Notas clínicas{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="child-notes"
                name="child-notes"
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Alergias, doenças crónicas, medicação habitual…"
                className="mt-2 rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                {editing ? "Guardar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

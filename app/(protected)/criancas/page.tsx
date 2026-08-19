"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Baby,
  CheckCircle2,
  Info,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useSession } from "@/components/layout/session-provider";
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

  const allChildren = useClinicStore((state) => state.children).filter(
    (child) => child.guardianId === user.id,
  );
  const children = allChildren.filter((child) => !child.archived);
  const archived = allChildren.filter((child) => child.archived);

  const consultations = useClinicStore((state) => state.consultations);
  const addChild = useClinicStore((state) => state.addChild);
  const updateChild = useClinicStore((state) => state.updateChild);
  const removeChild = useClinicStore((state) => state.removeChild);
  const archiveChild = useClinicStore((state) => state.archiveChild);
  const restoreChild = useClinicStore((state) => state.restoreChild);

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

  /**
   * Eliminar só quando não há nada a preservar. Havendo pedidos ou histórico
   * clínico, a acção disponível é arquivar — o registo clínico da criança
   * nunca é apagado.
   */
  function handleRemove(child: Child) {
    setError(null);
    const result = removeChild(child.id);

    if (!result.ok) {
      setFeedback(null);
      setError(result.error);
      return;
    }

    setFeedback(`${child.name} foi eliminado(a) do registo.`);
  }

  function handleArchive(child: Child) {
    setError(null);
    const result = archiveChild(child.id);

    if (!result.ok) {
      setFeedback(null);
      setError(result.error);
      return;
    }

    setFeedback(
      `${child.name} foi arquivado(a). O histórico clínico continua guardado.`,
    );
  }

  function handleRestore(child: Child) {
    setError(null);
    const result = restoreChild(child.id);
    if (result.ok) setFeedback(`${child.name} voltou à lista activa.`);
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
                    {/*
                      Com um pedido em aberto não há nada a solicitar: um
                      `Link` com `disabled` continuaria a navegar, por isso
                      passa a ser um botão inerte com a razão à vista.
                    */}
                    {openRequest ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled
                        title={`${openRequest.reference} ainda está em aberto`}
                      >
                        <Stethoscope data-icon="inline-start" />
                        Pedido em aberto
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/teleconsultas/novo?crianca=${child.id}`}>
                          <Stethoscope data-icon="inline-start" />
                          Solicitar
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Editar ${child.name}`}
                      onClick={() => openEdit(child)}
                    >
                      <Pencil />
                    </Button>
                    {total === 0 ? (
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Eliminar ${child.name}`}
                        title="Eliminar (só possível sem pedidos associados)"
                        onClick={() => handleRemove(child)}
                      >
                        <Trash2 />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Arquivar ${child.name}`}
                        title="Arquivar — preserva o histórico clínico"
                        disabled={Boolean(openRequest)}
                        onClick={() => handleArchive(child)}
                      >
                        <Archive />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {archived.length > 0 ? (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <h2 className="font-bold tracking-tight">Crianças arquivadas</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              O histórico clínico destas crianças continua guardado e pode ser
              consultado em «Histórico clínico».
            </p>

            <ul className="mt-4 divide-y divide-border">
              {archived.map((child) => (
                <li
                  key={child.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {describeAge(child.birthDate)} · arquivada
                      {child.archivedAt ? ` em ${formatDate(child.archivedAt)}` : ""}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(child)}
                  >
                    <ArchiveRestore data-icon="inline-start" />
                    Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Alert variant="info">
          <Info />
          <AlertTitle>Eliminar ou arquivar?</AlertTitle>
          <AlertDescription>
            Uma criança sem qualquer pedido pode ser eliminada. A partir do
            momento em que existe um pedido ou histórico clínico, a opção passa
            a ser <strong>Arquivar</strong>: o registo sai da lista activa, mas
            toda a informação clínica é preservada.
          </AlertDescription>
        </Alert>
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
                required
                aria-required="true"
                minLength={3}
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
                  required
                  aria-required="true"
                  max={new Date().toISOString().slice(0, 10)}
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

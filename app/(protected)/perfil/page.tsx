"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, Save } from "lucide-react";

import {
  NeighbourhoodField,
  resolveNeighbourhood,
  splitNeighbourhood,
} from "@/components/forms/neighbourhood-field";
import { AppHeader } from "@/components/layout/app-header";
import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { PageShell } from "@/components/layout/page-shell";
import { initialsOf } from "@/components/layout/nav-items";
import { useSession } from "@/components/layout/session-provider";
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
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { Shift } from "@/lib/types/user";
import {
  accountStateLabels,
  roleLabels,
  roleResponsibilities,
  shiftLabels,
} from "@/lib/types/user";
import { formatDate } from "@/lib/utils/date";

export default function PerfilPage() {
  const user = useSession();
  const router = useRouter();

  const updateProfile = useClinicStore((state) => state.updateProfile);
  const logout = useClinicStore((state) => state.logout);
  const resetDemo = useClinicStore((state) => state.resetDemo);

  const initialAddress = splitNeighbourhood(user.address);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: initialAddress.value,
    addressOther: initialAddress.customValue,
    idDocument: user.idDocument ?? "",
    specialty: user.specialty ?? "",
    licenseNumber: user.licenseNumber ?? "",
    shift: user.shift ?? "",
    available: user.available ?? true,
    password: "",
  });
  const { feedback, showOk, showError, clear } = useFeedback();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clear();

    const result = updateProfile(user.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: resolveNeighbourhood(form.address, form.addressOther),
      idDocument: form.idDocument.trim(),
      specialty: form.specialty.trim() || undefined,
      licenseNumber: form.licenseNumber.trim() || undefined,
      ...(user.role === "PEDIATRA"
        ? { shift: (form.shift || undefined) as Shift | undefined, available: form.available }
        : {}),
      ...(form.password ? { password: form.password } : {}),
    });

    if (!result.ok) {
      showError(result.error);
      return;
    }

    setForm((current) => ({ ...current, password: "" }));
    showOk("Perfil actualizado com sucesso.");
  }

  function handleReset() {
    resetDemo();
    router.push("/login");
  }

  return (
    <>
      <AppHeader user={user} title="Perfil" subtitle="Os seus dados na plataforma." />

      <PageShell>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8 sm:p-6"
          >
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-lg font-bold text-primary">
                {initialsOf(user.name)}
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">{user.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {roleLabels[user.role]} · desde {formatDate(user.createdAt)} ·
                  conta {accountStateLabels[user.state].toLowerCase()}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <FeedbackAlert feedback={feedback} />

              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  id="profile-name"
                  label="Nome completo"
                  value={form.name}
                  onChange={(value) => setForm((c) => ({ ...c, name: value }))}
                />
                <ProfileField
                  id="profile-email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((c) => ({ ...c, email: value }))}
                />
                <ProfileField
                  id="profile-phone"
                  label="Telefone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm((c) => ({ ...c, phone: value }))}
                />

                {user.role === "ENCARREGADO" ? (
                  <>
                    <ProfileField
                      id="profile-id-document"
                      label="Documento de identificação"
                      value={form.idDocument}
                      onChange={(value) =>
                        setForm((c) => ({ ...c, idDocument: value }))
                      }
                    />
                    <div className="sm:col-span-2">
                      <NeighbourhoodField
                        id="profile-address"
                        value={form.address}
                        customValue={form.addressOther}
                        onChange={(value) =>
                          setForm((c) => ({ ...c, address: value }))
                        }
                        onCustomChange={(value) =>
                          setForm((c) => ({ ...c, addressOther: value }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileField
                      id="profile-specialty"
                      label="Especialidade"
                      value={form.specialty}
                      onChange={(value) =>
                        setForm((c) => ({ ...c, specialty: value }))
                      }
                    />
                    <ProfileField
                      id="profile-license"
                      label="Nº da Ordem"
                      value={form.licenseNumber}
                      onChange={(value) =>
                        setForm((c) => ({ ...c, licenseNumber: value }))
                      }
                    />

                    {user.role === "PEDIATRA" ? (
                      <>
                        <div>
                          <Label htmlFor="profile-shift" className="text-sm font-semibold">
                            Turno de escala
                          </Label>
                          <Select
                            value={form.shift}
                            onValueChange={(value) =>
                              setForm((c) => ({ ...c, shift: value as Shift }))
                            }
                          >
                            <SelectTrigger id="profile-shift" className="mt-2 h-11 w-full rounded-xl">
                              <SelectValue placeholder="Seleccione o turno" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MANHA">{shiftLabels.MANHA}</SelectItem>
                              <SelectItem value="TARDE">{shiftLabels.TARDE}</SelectItem>
                              <SelectItem value="NOITE">{shiftLabels.NOITE}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="profile-available" className="text-sm font-semibold">
                            Disponibilidade
                          </Label>
                          <Select
                            value={form.available ? "SIM" : "NAO"}
                            onValueChange={(value) =>
                              setForm((c) => ({ ...c, available: value === "SIM" }))
                            }
                          >
                            <SelectTrigger id="profile-available" className="mt-2 h-11 w-full rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SIM">Disponível no turno</SelectItem>
                              <SelectItem value="NAO">
                                Indisponível no turno
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : null}
                  </>
                )}

                <ProfileField
                  id="profile-password"
                  label="Nova palavra-passe"
                  type="password"
                  required={false}
                  minLength={6}
                  value={form.password}
                  onChange={(value) => setForm((c) => ({ ...c, password: value }))}
                  hint="Deixe em branco para manter a actual. Mínimo 6 caracteres."
                />
              </div>

              <Button type="submit" size="xl">
                <Save data-icon="inline-start" />
                Guardar alterações
              </Button>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">
                O que este perfil pode fazer
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {roleResponsibilities[user.role]}
              </p>
            </section>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Sessão</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Terminar sessão encerra o acesso de forma segura neste navegador.
                Os dados ficam guardados localmente.
              </p>
              <Button
                variant="outline"
                size="lg"
                className="mt-4 w-full"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                <LogOut data-icon="inline-start" />
                Terminar sessão
              </Button>
            </section>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Dados de demonstração</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Repõe utilizadores, crianças e pedidos ao estado inicial. Tudo o
                que criou durante a demonstração será apagado.
              </p>
              <Button
                variant="destructive"
                size="lg"
                className="mt-4 w-full"
                onClick={handleReset}
              >
                <RotateCcw data-icon="inline-start" />
                Repor demonstração
              </Button>
            </section>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  type = "text",
  hint,
  required = true,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete="off"
        required={required}
        aria-required={required}
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 rounded-xl px-3.5"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

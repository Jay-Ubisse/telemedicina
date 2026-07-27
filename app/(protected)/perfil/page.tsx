"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Save,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { initialsOf } from "@/components/layout/nav-items";
import { useSession } from "@/components/layout/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicStore } from "@/lib/store/clinic-store";
import { roleLabels } from "@/lib/types/user";
import { formatDate } from "@/lib/utils/date";

export default function PerfilPage() {
  const user = useSession();
  const router = useRouter();

  const updateProfile = useClinicStore((state) => state.updateProfile);
  const logout = useClinicStore((state) => state.logout);
  const resetDemo = useClinicStore((state) => state.resetDemo);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address ?? "",
    idDocument: user.idDocument ?? "",
    specialty: user.specialty ?? "",
    licenseNumber: user.licenseNumber ?? "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const result = updateProfile(user.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      idDocument: form.idDocument.trim(),
      specialty: form.specialty.trim() || undefined,
      licenseNumber: form.licenseNumber.trim() || undefined,
      ...(form.password ? { password: form.password } : {}),
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setForm((current) => ({ ...current, password: "" }));
    setFeedback("Perfil actualizado com sucesso.");
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
                  {roleLabels[user.role]} · desde {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-6">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {feedback ? (
                <Alert variant="success">
                  <CheckCircle2 />
                  <AlertDescription>{feedback}</AlertDescription>
                </Alert>
              ) : null}

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
                      <ProfileField
                        id="profile-address"
                        label="Bairro / endereço"
                        value={form.address}
                        onChange={(value) =>
                          setForm((c) => ({ ...c, address: value }))
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
                  </>
                )}

                <ProfileField
                  id="profile-password"
                  label="Nova palavra-passe"
                  type="password"
                  value={form.password}
                  onChange={(value) => setForm((c) => ({ ...c, password: value }))}
                  hint="Deixe em branco para manter a actual."
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
              <h2 className="font-bold tracking-tight">Sessão</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Terminar sessão remove o acesso neste navegador. Os dados ficam
                guardados localmente.
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 rounded-xl px-3.5"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD } from "@/lib/data/seed";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { UserRole } from "@/lib/types/user";
import { cn } from "@/lib/utils";

/**
 * O perfil é a primeira decisão do ecrã, não um detalhe: cada um entra num
 * painel diferente. Escolher um perfil preenche a conta de demonstração
 * correspondente e explica o que essa pessoa vai encontrar.
 */
const profiles: {
  role: UserRole;
  label: string;
  email: string;
  icon: typeof UserRound;
  lands: string;
}[] = [
  {
    role: "ENCARREGADO",
    label: "Encarregado",
    email: "ana@exemplo.mz",
    icon: UserRound,
    lands: "Pedidos da sua família, crianças e orientações recebidas.",
  },
  {
    role: "PEDIATRA",
    label: "Pediatra",
    email: "sara@hgm.mz",
    icon: Stethoscope,
    lands: "Fila de triagem, agenda do dia e sala de teleconsulta.",
  },
  {
    role: "ADMIN",
    label: "Administração",
    email: "admin@hgm.mz",
    icon: ShieldCheck,
    lands: "Gestão de utilizadores, relatórios e exportação de dados.",
  },
];

export function LoginView() {
  const router = useRouter();
  const login = useClinicStore((state) => state.login);

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function pickProfile(role: UserRole) {
    const profile = profiles.find((item) => item.role === role)!;
    setSelected(role);
    setEmail(profile.email);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = login(email, password);

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/inicio");
  }

  const active = profiles.find((item) => item.role === selected);

  return (
    <AuthLayout
      eyebrow="Acesso à plataforma"
      title="Aceda ao seu painel."
      description="Use as suas credenciais. Se está a experimentar o protótipo, escolha um perfil de demonstração."
      aside={
        <p className="text-center font-mono text-[0.625rem] tracking-[0.14em] text-ink-muted uppercase">
          <Smartphone className="mr-1.5 inline size-3" />
          Sem internet? Marque{" "}
          <span className="text-primary">*123#</span> ou{" "}
          <Link
            href="/ussd"
            className="text-ink-foreground underline underline-offset-4 hover:text-primary"
          >
            abra o simulador
          </Link>
        </p>
      }
    >
      <fieldset>
        <legend className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
          Perfis de demonstração
        </legend>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {profiles.map((profile) => {
            const isActive = selected === profile.role;

            return (
              <button
                key={profile.role}
                type="button"
                aria-pressed={isActive}
                onClick={() => pickProfile(profile.role)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border px-2 py-3 transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <profile.icon
                  className={cn(
                    "size-4",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-center text-xs font-semibold">
                  {profile.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 min-h-8 text-xs leading-relaxed text-muted-foreground">
          {active
            ? active.lands
            : "Escolha um perfil para preencher as credenciais de demonstração."}
        </p>
      </fieldset>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[0.5625rem] tracking-[0.16em] text-muted-foreground uppercase">
          ou entre com a sua conta
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="exemplo@hgm.mz"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-lg px-3.5"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold">
              Palavra-passe
            </Label>
            <Link
              href="/recuperar"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Esqueci-me
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-lg px-3.5 pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"
              }
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="xl"
          className="w-full rounded-lg"
          disabled={submitting}
        >
          {submitting ? "A entrar…" : "Entrar"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>

      <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/registo" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}

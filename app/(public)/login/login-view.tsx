"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  Copy,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD } from "@/lib/data/seed";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { UserRole } from "@/lib/types/user";
import { cn } from "@/lib/utils";

/**
 * Perfis de demonstração (§1 do relatório).
 *
 * Existem quatro ambientes com permissões distintas e, na página de acesso, cada
 * um permite as três coisas que o relatório pede: entrada automática («Entrar
 * directamente»), preenchimento das credenciais fictícias (ao escolher o perfil)
 * e apresentação clara dessas credenciais (email e palavra-passe à vista, com
 * botão para copiar).
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
    lands:
      "Registar crianças, submeter pedidos, acompanhar o estado e consultar orientações e prescrições.",
  },
  {
    role: "TRIAGEM",
    label: "Triagem",
    email: "triagem@hgm.mz",
    icon: ClipboardCheck,
    lands:
      "Analisar sintomas, atribuir prioridade, registar observações, justificar alterações e encaminhar pedidos.",
  },
  {
    role: "ADMINISTRATIVO",
    label: "Administrativo",
    email: "admin@hgm.mz",
    icon: ShieldCheck,
    lands:
      "Organizar pedidos triados, consultar a disponibilidade, atribuir pediatras e gerir utilizadores.",
  },
  {
    role: "PEDIATRA",
    label: "Pediatra",
    email: "sara@hgm.mz",
    icon: Stethoscope,
    lands:
      "Receber pedidos atribuídos, definir o horário, realizar a teleconsulta e registar notas e prescrição.",
  },
];

export function LoginView() {
  const router = useRouter();
  const login = useClinicStore((state) => state.login);
  const { feedback, showError, clear } = useFeedback();

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  function pickProfile(role: UserRole) {
    const profile = profiles.find((item) => item.role === role)!;
    setSelected(role);
    setEmail(profile.email);
    setPassword(DEMO_PASSWORD);
    setCopied(false);
    clear();
  }

  function signIn(withEmail: string, withPassword: string) {
    setSubmitting(true);
    const result = login(withEmail, withPassword);

    if (!result.ok) {
      showError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/inicio");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clear();
    signIn(email, password);
  }

  /** Entrada automática: escolhe o perfil e entra num só passo. */
  function enterDirectly(role: UserRole) {
    const profile = profiles.find((item) => item.role === role)!;
    setSelected(role);
    setEmail(profile.email);
    setPassword(DEMO_PASSWORD);
    clear();
    signIn(profile.email, DEMO_PASSWORD);
  }

  async function copyCredentials() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(`${active.email} / ${DEMO_PASSWORD}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sem permissão para a área de transferência as credenciais continuam
      // visíveis no ecrã — que é o essencial.
      setCopied(false);
    }
  }

  const active = profiles.find((item) => item.role === selected);

  return (
    <AuthLayout
      eyebrow="Acesso à plataforma"
      title="Aceda ao seu painel."
      description="Use as suas credenciais. Se está a experimentar o protótipo, escolha um dos quatro perfis de demonstração."
      aside={
        <p className="text-center text-xs text-ink-muted">
          Sem acesso à Internet? Veja como seria a solicitação de uma
          teleconsulta no{" "}
          <Link
            href="/ussd"
            className="text-ink-foreground underline underline-offset-4 hover:text-primary"
          >
            Simulador USSD
          </Link>
          .
        </p>
      }
    >
      <fieldset>
        <legend className="text-[0.625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
          Perfis de demonstração
        </legend>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

        {active ? (
          <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3.5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {active.lands}
            </p>

            <dl className="mt-3 grid gap-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium break-all">{active.email}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Palavra-passe</dt>
                <dd className="font-medium">{DEMO_PASSWORD}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => enterDirectly(active.role)}
                disabled={submitting}
              >
                <LogIn data-icon="inline-start" />
                Entrar directamente
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyCredentials}
              >
                <Copy data-icon="inline-start" />
                {copied ? "Credenciais copiadas" : "Copiar credenciais"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2.5 min-h-8 text-xs leading-relaxed text-muted-foreground">
            Escolha um perfil para ver as credenciais de demonstração e entrar
            directamente.
          </p>
        )}
      </fieldset>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.5625rem] tracking-[0.16em] text-muted-foreground font-semibold uppercase">
          ou entre com a sua conta
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FeedbackAlert feedback={feedback} />

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
            onChange={(event) => {
              setEmail(event.target.value);
              // A mensagem de erro deixa de ser aplicável assim que o
              // utilizador corrige os dados (§12 do relatório).
              clear();
            }}
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
              onChange={(event) => {
                setPassword(event.target.value);
                clear();
              }}
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

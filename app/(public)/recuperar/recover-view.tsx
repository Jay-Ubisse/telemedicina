"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Smartphone } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicStore } from "@/lib/store/clinic-store";
import { maskPhone } from "@/lib/auth/access";

/**
 * Recuperação de palavra-passe.
 *
 * No protótipo não há envio real de SMS nem de email: o ecrã confirma o canal
 * pelo qual o código seria enviado e diz sempre a mesma coisa, exista ou não a
 * conta — não revelar que endereços estão registados é a prática correcta.
 */
export function RecoverView() {
  const users = useClinicStore((state) => state.users);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Indique um email válido.");
      return;
    }

    const match = users.find((user) => user.email.toLowerCase() === value);

    setError(null);
    setSentTo(match?.phone ? maskPhone(match.phone) : "+258 8* *** ****");
  }

  return (
    <AuthLayout
      eyebrow="Recuperar acesso"
      title="Esqueceu-se da palavra-passe?"
      description="Indique o email da conta. Enviamos um código de recuperação por SMS para o número registado."
      aside={
        <p className="text-center text-[0.625rem] tracking-[0.14em] text-ink-muted font-semibold uppercase">
          <Smartphone className="mr-1.5 inline size-3" />
          Sem acesso ao número? Contacte o HGM pelo{" "}
          <span className="text-primary">1420</span>
        </p>
      }
    >
      {sentTo ? (
        <div className="space-y-5">
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Código enviado</AlertTitle>
            <AlertDescription>
              Se existir uma conta associada a <strong>{email.trim()}</strong>,
              enviámos um código de recuperação por SMS para {sentTo}. O código
              é válido durante 15 minutos.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <AlertCircle />
            <AlertDescription>
              Nesta pré-visualização não há envio real de SMS. A palavra-passe
              das contas de demonstração é <strong>demo1234</strong>; as contas
              criadas pela administração são repostas na área de Administração.
            </AlertDescription>
          </Alert>

          <Button asChild size="xl" className="w-full rounded-lg">
            <Link href="/login">
              Voltar ao início de sessão
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="recover-email" className="text-sm font-semibold">
              Email da conta
            </Label>
            <Input
              id="recover-email"
              name="recover-email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              placeholder="exemplo@hgm.mz"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              className="h-11 rounded-lg px-3.5"
            />
          </div>

          <Button type="submit" size="xl" className="w-full rounded-lg">
            Enviar código por SMS
            <ArrowRight data-icon="inline-end" />
          </Button>

          <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Lembrou-se da palavra-passe?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

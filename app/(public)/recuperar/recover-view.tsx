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
 * No protótipo não há envio real de mensagens: a confirmação é uma notificação
 * simulada, e o ecrã diz sempre a mesma coisa, exista ou não a conta — não
 * revelar que endereços estão registados é a prática correcta.
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
      description="Indique o email da conta. O código de recuperação é apresentado como notificação simulada para o número registado."
      aside={
        <p className="text-center text-xs text-ink-muted">
          <Smartphone className="mr-1.5 inline size-3" />
          Sem acesso ao número registado? Peça à administração do HGM para
          actualizar o contacto da conta.
        </p>
      }
    >
      {sentTo ? (
        <div className="space-y-5">
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Código gerado</AlertTitle>
            <AlertDescription>
              Se existir uma conta associada a <strong>{email.trim()}</strong>, foi
              gerado um código de recuperação para o número {sentTo}, apresentado
              como notificação simulada. O código é válido durante 15 minutos.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <AlertCircle />
            <AlertDescription>
              Nesta pré-visualização não existe qualquer envio externo de
              mensagens. A palavra-passe das contas de demonstração é{" "}
              <strong>demo1234</strong>; as contas criadas pela administração são
              repostas na área de Administração.
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
            Gerar código de recuperação
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

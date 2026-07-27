"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Baby,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_AGE_YEARS } from "@/lib/data/symptoms";
import { useClinicStore } from "@/lib/store/clinic-store";
import { ageInYears } from "@/lib/utils/date";
import { validateChildAge } from "@/lib/utils/triage";
import { cn } from "@/lib/utils";

/**
 * Estado único e explícito do formulário.
 *
 * O relatório de testes descreve que o email e a palavra-passe do passo 1
 * "passavam" para os campos de documento e endereço do passo 2. Isso acontece
 * quando os passos partilham a mesma posição no DOM com campos não
 * identificados: o React reaproveita o nó e o browser reaplica o preenchimento
 * automático. Aqui cada campo tem `id`, `name` e `autoComplete` próprios e
 * escreve numa chave distinta deste objecto, pelo que não há forma de um valor
 * migrar para outro campo.
 */
type FormState = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  idDocument: string;
  address: string;
  childName: string;
  childBirthDate: string;
  childSex: "M" | "F" | "";
  childNotes: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phone: "",
  idDocument: "",
  address: "",
  childName: "",
  childBirthDate: "",
  childSex: "",
  childNotes: "",
};

const stepsMeta = [
  { title: "Conta", description: "Os seus dados de acesso" },
  { title: "Contacto", description: "Como o HGM o encontra" },
  { title: "Criança", description: "Quem vai ser acompanhado" },
];

const benefits = [
  {
    icon: BadgeCheck,
    title: "Pediatras do HGM",
    description: "Atendimento por profissionais certificados do hospital.",
  },
  {
    icon: MapPin,
    title: "Sem deslocações desnecessárias",
    description: "Orientação clínica a partir de casa, na cidade de Maputo.",
  },
  {
    icon: ShieldCheck,
    title: "Dados protegidos",
    description: "Informação clínica acessível apenas à equipa responsável.",
  },
];

export function RegisterView() {
  const router = useRouter();
  const register = useClinicStore((state) => state.register);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError(null);
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (form.fullName.trim().length < 3) return "Indique o seu nome completo.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return "Indique um email válido.";
      }
      if (form.password.length < 6) {
        return "A palavra-passe deve ter pelo menos 6 caracteres.";
      }
      if (form.password !== form.passwordConfirm) {
        return "As palavras-passe não coincidem.";
      }
      return null;
    }

    if (index === 1) {
      if (form.phone.trim().length < 9) {
        return "Indique um número de telefone válido (9 dígitos).";
      }
      if (form.idDocument.trim().length < 5) {
        return "Indique o número do documento de identificação.";
      }
      if (form.address.trim().length < 4) {
        return "Indique o bairro e a avenida / rua.";
      }
      return null;
    }

    if (!form.childName.trim()) return "Indique o nome da criança.";
    if (!form.childBirthDate) return "Indique a data de nascimento.";
    if (new Date(form.childBirthDate) > new Date()) {
      return "A data de nascimento não pode estar no futuro.";
    }

    const validation = validateChildAge(ageInYears(form.childBirthDate));
    if (!validation.valid) return validation.error!;

    if (!form.childSex) return "Seleccione o sexo da criança.";
    return null;
  }

  function goNext() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, stepsMeta.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((value) => Math.max(value - 1, 0));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const problem = validateStep(2);
    if (problem) {
      setError(problem);
      return;
    }

    const result = register({
      name: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      idDocument: form.idDocument,
      address: form.address,
      child: {
        name: form.childName,
        birthDate: form.childBirthDate,
        sex: form.childSex as "M" | "F",
        notes: form.childNotes,
      },
    });

    if (!result.ok) {
      // Um email duplicado só é detectado no fim; volta ao passo da conta.
      setError(result.error);
      setStep(0);
      return;
    }

    router.push("/inicio");
  }

  const isLastStep = step === stepsMeta.length - 1;

  return (
    <AuthLayout
      eyebrow={`Criar conta · passo ${step + 1} de ${stepsMeta.length}`}
      title="Crie a conta da sua família."
      description="Três passos e fica pronto para solicitar teleconsultas pediátricas no Hospital Geral de Mavalane."
      aside={
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase"
            >
              <benefit.icon className="size-3 text-primary" />
              {benefit.title}
            </li>
          ))}
        </ul>
      }
    >
      <div>
        <ol
          className="flex items-stretch gap-2"
          aria-label="Progresso do registo"
        >
          {stepsMeta.map((meta, index) => {
            const done = index < step;
            const active = index === step;

            return (
              <li key={meta.title} className="flex flex-1 flex-col gap-2">
                <span
                  className={cn(
                    "h-0.5 transition-colors",
                    done || active ? "bg-primary" : "bg-border",
                  )}
                />
                <span className="flex items-center gap-1.5">
                  {done ? <Check className="size-3 text-primary" /> : null}
                  <span
                    className={cn(
                      "font-mono text-[0.5625rem] tracking-[0.14em] uppercase",
                      active
                        ? "text-primary"
                        : done
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {meta.title}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <h2 className="mt-7 font-heading text-xl font-bold tracking-tight">
          {stepsMeta[step].title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {stepsMeta[step].description}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {step === 0 ? (
            <>
              <Field
                id="register-full-name"
                label="Nome completo"
                autoComplete="name"
                value={form.fullName}
                onChange={(value) => update("fullName", value)}
                placeholder="Ana Mondlane"
              />
              <Field
                id="register-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(value) => update("email", value)}
                placeholder="ana@exemplo.mz"
              />
              <Field
                id="register-password"
                label="Criar palavra-passe"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(value) => update("password", value)}
                placeholder="Mínimo 6 caracteres"
              />
              <Field
                id="register-password-confirm"
                label="Confirmar palavra-passe"
                type="password"
                autoComplete="new-password"
                value={form.passwordConfirm}
                onChange={(value) => update("passwordConfirm", value)}
                placeholder="Repita a palavra-passe"
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field
                id="register-phone"
                label="Telefone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(value) => update("phone", value)}
                placeholder="+258 84 000 0000"
                hint="É para este número que enviamos o link e as confirmações por SMS."
              />
              <Field
                id="register-id-document"
                label="Documento de identificação"
                autoComplete="off"
                value={form.idDocument}
                onChange={(value) => update("idDocument", value)}
                placeholder="BI / DIRE / Passaporte"
              />
              <Field
                id="register-address"
                label="Bairro / endereço"
                autoComplete="street-address"
                value={form.address}
                onChange={(value) => update("address", value)}
                placeholder="Mavalane A, Av. de Moçambique nº 421"
                hint="O serviço opera na cidade de Maputo."
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field
                id="register-child-name"
                label="Nome da criança"
                autoComplete="off"
                value={form.childName}
                onChange={(value) => update("childName", value)}
                placeholder="Tiago Mondlane"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="register-child-birth"
                  label="Data de nascimento"
                  type="date"
                  autoComplete="off"
                  value={form.childBirthDate}
                  onChange={(value) => update("childBirthDate", value)}
                  hint={`Serviço exclusivo dos 0 aos ${MAX_AGE_YEARS} anos.`}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Sexo</Label>
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "M", label: "Masculino" },
                        { value: "F", label: "Feminino" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => update("childSex", option.value)}
                        className={cn(
                          "h-11 flex-1 rounded-xl text-sm font-medium ring-1 transition-all",
                          form.childSex === option.value
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

              <div className="space-y-2">
                <Label htmlFor="register-child-notes" className="text-sm font-semibold">
                  Notas clínicas{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="register-child-notes"
                  name="register-child-notes"
                  rows={3}
                  value={form.childNotes}
                  onChange={(event) => update("childNotes", event.target.value)}
                  placeholder="Alergias, doenças crónicas, medicação habitual…"
                  className="rounded-xl"
                />
              </div>

              <Alert variant="info">
                <Baby />
                <AlertDescription>
                  Poderá cadastrar mais crianças a qualquer momento no separador
                  <strong className="font-semibold"> Crianças</strong>.
                </AlertDescription>
              </Alert>
            </>
          ) : null}

          <div className="flex gap-3 pt-1">
            {step > 0 ? (
              <Button type="button" variant="outline" size="xl" onClick={goBack}>
                <ArrowLeft data-icon="inline-start" />
                Voltar
              </Button>
            ) : null}

            {isLastStep ? (
              <Button
                type="submit"
                size="xl"
                className="flex-1 shadow-md shadow-primary/20"
              >
                Criar conta
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                type="button"
                size="xl"
                className="flex-1 shadow-md shadow-primary/20"
                onClick={goNext}
              >
                Continuar
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  hint,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        // `name` distinto por campo — impede que o browser reutilize o valor
        // de um passo anterior noutro campo.
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl px-3.5"
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

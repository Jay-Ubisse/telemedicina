"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CornerDownLeft,
  Info,
  LayoutDashboard,
  RotateCcw,
  Smartphone,
} from "lucide-react";

import { UssdDevice, UssdDialog } from "@/components/ussd/ussd-device";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { MAX_AGE_YEARS, ussdSymptomMenu } from "@/lib/data/symptoms";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  channelLabels,
  priorityLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { formatDateTime, formatTime } from "@/lib/utils/date";
import { validateChildAge } from "@/lib/utils/triage";

type Step =
  | "MENU"
  | "NOME"
  | "IDADE"
  | "LOCALIZACAO"
  | "SINTOMA"
  | "OUTRO_SINTOMA"
  | "CANAL"
  | "OBSERVACOES"
  | "CONFIRMACAO"
  | "RESULTADO"
  | "PEDIDOS"
  | "FIM";

type Draft = {
  childName: string;
  age: string;
  location: string;
  symptoms: string[];
  otherSymptom: string;
  channel: ConsultationChannel | "";
  notes: string;
};

const emptyDraft: Draft = {
  childName: "",
  age: "",
  location: "",
  symptoms: [],
  otherSymptom: "",
  channel: "",
  notes: "",
};

const SYMPTOMS_PER_PAGE = 6;
const OTHER_KEY = String(ussdSymptomMenu.length);
/** Convenção USSD para paginação; não colide com nenhum número de sintoma. */
const NEXT_PAGE_KEY = "99";

/** Números "de SIM" disponíveis no simulador. */
const simCards = [
  { phone: "+258 84 512 3390", label: "Ana Mondlane" },
  { phone: "+258 82 771 4408", label: "Carla Nhaca" },
  { phone: "+258 86 330 9812", label: "Paulo Cossa" },
  { phone: "+258 84 777 1200", label: "Número não registado" },
];

export function UssdView() {
  const hydrated = useHydrated();

  const users = useClinicStore((state) => state.users);
  const children = useClinicStore((state) => state.children);
  const consultations = useClinicStore((state) => state.consultations);
  const createConsultation = useClinicStore((state) => state.createConsultation);

  const [sim, setSim] = useState(simCards[0].phone);
  const [step, setStep] = useState<Step>("MENU");
  // A pilha só é lida dentro dos updaters funcionais de `setHistory`.
  const [, setHistory] = useState<Step[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [symptomPage, setSymptomPage] = useState(0);
  const [result, setResult] = useState<{
    message: string;
    reference: string;
    status: string;
    priority: string;
    isEmergency: boolean;
  } | null>(null);

  /**
   * O número é capturado automaticamente pela rede — o utilizador nunca o
   * digita no menu USSD.
   */
  const capturedPhone = sim;

  const guardian = useMemo(
    () => users.find((user) => user.phone === capturedPhone) ?? null,
    [users, capturedPhone],
  );

  const myRequests = useMemo(
    () =>
      consultations
        .filter((item) => item.phone === capturedPhone)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [consultations, capturedPhone],
  );

  function goTo(next: Step) {
    setHistory((stack) => [...stack, step]);
    setStep(next);
    setInput("");
    setError(null);
  }

  /** "0" devolve sempre o utilizador ao ecrã anterior. */
  function goBack() {
    setInput("");
    setError(null);

    setHistory((stack) => {
      if (stack.length === 0) {
        setStep("MENU");
        return [];
      }
      setStep(stack[stack.length - 1]);
      return stack.slice(0, -1);
    });
  }

  function reset() {
    setDraft(emptyDraft);
    setInput("");
    setError(null);
    setResult(null);
    setSymptomPage(0);
    setHistory([]);
    setStep("MENU");
  }

  const symptomPages = Math.ceil(ussdSymptomMenu.length / SYMPTOMS_PER_PAGE);
  const visibleSymptoms = ussdSymptomMenu.slice(
    symptomPage * SYMPTOMS_PER_PAGE,
    symptomPage * SYMPTOMS_PER_PAGE + SYMPTOMS_PER_PAGE,
  );

  function submit() {
    const value = input.trim();

    // "0" é universal: volta ao menu anterior (excepto no menu inicial).
    if (value === "0" && step !== "MENU" && step !== "RESULTADO") {
      goBack();
      return;
    }

    if (step === "MENU") {
      if (value === "1") return goTo("NOME");
      if (value === "2") return goTo("PEDIDOS");
      if (value === "3" || value === "0") return setStep("FIM");
      return setError("Opção inválida.");
    }

    if (step === "NOME") {
      if (value.length < 3) return setError("Digite o nome completo da criança.");
      setDraft((current) => ({ ...current, childName: value }));
      return goTo("IDADE");
    }

    if (step === "IDADE") {
      const validation = validateChildAge(value);
      if (!validation.valid) return setError(validation.error!);
      setDraft((current) => ({ ...current, age: value }));
      return goTo("LOCALIZACAO");
    }

    if (step === "LOCALIZACAO") {
      if (value.length < 3) {
        return setError("Digite o bairro e a avenida / rua.");
      }
      setDraft((current) => ({ ...current, location: value }));
      return goTo("SINTOMA");
    }

    if (step === "SINTOMA") {
      // "99" avança para a página seguinte do catálogo. Não pode ser "9",
      // que já é o número de um sintoma da lista.
      if (value === NEXT_PAGE_KEY && symptomPages > 1) {
        setSymptomPage((page) => (page + 1) % symptomPages);
        setInput("");
        setError(null);
        return;
      }

      if (value === OTHER_KEY) {
        setDraft((current) => ({ ...current, symptoms: [] }));
        return goTo("OUTRO_SINTOMA");
      }

      const option = ussdSymptomMenu.find((item) => item.key === value);
      if (!option) return setError("Opção inválida.");

      setDraft((current) => ({
        ...current,
        symptoms: [option.label],
        otherSymptom: "",
      }));
      return goTo("CANAL");
    }

    if (step === "OUTRO_SINTOMA") {
      if (value.length < 3) return setError("Descreva o sintoma da criança.");
      setDraft((current) => ({ ...current, otherSymptom: value }));
      return goTo("CANAL");
    }

    if (step === "CANAL") {
      if (value !== "1" && value !== "2") return setError("Digite 1 ou 2.");
      setDraft((current) => ({
        ...current,
        channel: value === "1" ? "VOZ" : "VIDEO",
      }));
      return goTo("OBSERVACOES");
    }

    if (step === "OBSERVACOES") {
      setDraft((current) => ({
        ...current,
        notes: value === "9" ? "" : value,
      }));
      return goTo("CONFIRMACAO");
    }

    if (step === "CONFIRMACAO") {
      if (value === "2") {
        // Corrigir: recomeça a recolha mantendo o que já foi digitado.
        setHistory([]);
        setStep("NOME");
        setInput("");
        setError(null);
        return;
      }

      if (value !== "1") return setError("Digite 1 para confirmar ou 2 para corrigir.");

      const child = guardian
        ? children.find(
            (item) =>
              item.guardianId === guardian.id &&
              item.name.toLowerCase() === draft.childName.trim().toLowerCase(),
          )
        : undefined;

      const created = createConsultation({
        childId: child?.id ?? "",
        guardianId: guardian?.id ?? null,
        fallbackChildName: draft.childName,
        fallbackChildAge: Number(draft.age),
        fallbackGuardianName: guardian?.name,
        phone: capturedPhone,
        location: draft.location,
        symptoms: draft.symptoms,
        otherSymptom: draft.otherSymptom,
        notes: draft.notes,
        channel: (draft.channel || "VOZ") as ConsultationChannel,
        source: "USSD",
      });

      if (!created.ok) return setError(created.error);

      setResult({
        message: created.data.message,
        reference: created.data.consultation.reference,
        status: statusLabels[created.data.consultation.status],
        priority: priorityLabels[created.data.consultation.priority],
        isEmergency: created.data.isEmergency,
      });
      setHistory([]);
      setStep("RESULTADO");
      setInput("");
      return;
    }

    if (step === "RESULTADO") {
      if (value === "1") {
        setDraft(emptyDraft);
        setResult(null);
        setSymptomPage(0);
        setHistory([]);
        setStep("NOME");
        setInput("");
        return;
      }
      return reset();
    }

    if (step === "PEDIDOS") {
      return reset();
    }
  }

  const canSend = step !== "FIM";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <CornerDownLeft className="size-4" />
            Voltar ao site
          </Link>

          <Button asChild variant="outline" size="lg">
            <Link href="/inicio">
              <LayoutDashboard data-icon="inline-start" />
              Ver painel clínico
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_minmax(0,24rem)] lg:py-14">
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-secondary-foreground ring-1 ring-primary/15">
              <Smartphone className="size-3.5 text-primary" />
              Canal offline
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Simulador USSD · *123#
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Reproduz o atendimento em telemóveis sem internet. Cada ecrã
              recebe um único campo e o pedido submetido entra directamente na
              fila de triagem do painel clínico.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <Label htmlFor="sim-card" className="text-sm font-semibold">
              Cartão SIM que está a marcar
            </Label>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              O número é capturado automaticamente pela rede — nunca é digitado
              no menu.
            </p>

            <Select
              value={sim}
              onValueChange={(value) => {
                setSim(value);
                reset();
              }}
            >
              <SelectTrigger id="sim-card" className="h-11 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {simCards.map((card) => (
                  <SelectItem key={card.phone} value={card.phone}>
                    {card.phone} · {card.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <h2 className="font-bold tracking-tight">Regras aplicadas</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                `Serviço exclusivo para crianças dos 0 aos ${MAX_AGE_YEARS} anos.`,
                "Digite 0 em qualquer ecrã para voltar ao passo anterior.",
                "Sintomas críticos geram encaminhamento imediato para a unidade sanitária.",
                "Recolhe-se apenas a localização (bairro / avenida), sem província nem distrito.",
                "Videochamada: o link é enviado por SMS depois do agendamento e expira 10 minutos após a hora marcada.",
                "O mesmo encarregado pode registar pedidos para crianças diferentes no mesmo dia.",
              ].map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <UssdDevice
            carrier="Rede HGM"
            footer={
              <div className="space-y-2">
                {error ? (
                  <Alert variant="destructive" className="bg-card">
                    <Info />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                {canSend ? (
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submit();
                      }}
                      placeholder="Resposta…"
                      aria-label="Resposta USSD"
                      className="h-10 flex-1 rounded-xl bg-background px-3"
                    />
                    <Button size="lg" className="h-10" onClick={submit}>
                      Enviar
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" className="h-10 w-full" onClick={reset}>
                    <RotateCcw data-icon="inline-start" />
                    Marcar *123# novamente
                  </Button>
                )}
              </div>
            }
          >
            <UssdScreen
              step={step}
              draft={draft}
              phone={capturedPhone}
              guardianName={guardian?.name ?? null}
              visibleSymptoms={visibleSymptoms}
              hasMorePages={symptomPages > 1}
              result={result}
              requests={hydrated ? myRequests : []}
            />
          </UssdDevice>
        </div>
      </main>
    </div>
  );
}

type ScreenProps = {
  step: Step;
  draft: Draft;
  phone: string;
  guardianName: string | null;
  visibleSymptoms: { key: string; label: string }[];
  hasMorePages: boolean;
  result: {
    message: string;
    reference: string;
    status: string;
    priority: string;
    isEmergency: boolean;
  } | null;
  requests: ReturnType<typeof useClinicStore.getState>["consultations"];
};

function UssdScreen({
  step,
  draft,
  phone,
  guardianName,
  visibleSymptoms,
  hasMorePages,
  result,
  requests,
}: ScreenProps) {
  if (step === "MENU") {
    return (
      <UssdDialog code="*123#">
        {`HGM TelePediatria
Número: ${phone}${guardianName ? `\n${guardianName}` : ""}

1. Solicitar teleconsulta
2. Ver os meus pedidos
3. Sair`}
      </UssdDialog>
    );
  }

  if (step === "NOME") {
    return (
      <UssdDialog code="*123# · 1/6">
        {`Nome completo da criança:

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "IDADE") {
    return (
      <UssdDialog code="*123# · 2/6">
        {`Criança: ${draft.childName}

Idade da criança (0-${MAX_AGE_YEARS} anos):

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "LOCALIZACAO") {
    return (
      <UssdDialog code="*123# · 3/6">
        {`Localização (bairro e avenida/rua):
Ex.: Mavalane A, Av. de Moçambique

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "SINTOMA") {
    const options = visibleSymptoms
      .map((item) => `${item.key}. ${item.label}`)
      .join("\n");

    return (
      <UssdDialog code="*123# · 4/6">
        {`Sintoma principal:
${options}
${hasMorePages ? "99. Mais opções\n" : ""}0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "OUTRO_SINTOMA") {
    return (
      <UssdDialog code="*123# · 4/6">
        {`Descreva o sintoma da criança:

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "CANAL") {
    return (
      <UssdDialog code="*123# · 5/6">
        {`Canal de atendimento:
1. Chamada de voz
2. Videochamada

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "OBSERVACOES") {
    return (
      <UssdDialog code="*123# · 6/6">
        {`Observações (opcional):
Escreva ou digite 9 para saltar.

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "CONFIRMACAO") {
    const symptom = draft.otherSymptom || draft.symptoms.join(", ") || "—";

    return (
      <UssdDialog code="*123# · Confirmar">
        {`Confirme o pedido:
Criança: ${draft.childName}
Idade: ${draft.age} anos
Local: ${draft.location}
Sintoma: ${symptom}
Canal: ${draft.channel ? channelLabels[draft.channel] : "—"}
Obs.: ${draft.notes || "sem observações"}

1. Confirmar
2. Corrigir dados
0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "RESULTADO" && result) {
    return (
      <UssdDialog
        code="*123# · Resultado"
        tone={result.isEmergency ? "danger" : "success"}
      >
        {`${result.message}

Referência: ${result.reference}
Estado: ${result.status}
Prioridade: ${result.priority}${
          draft.channel === "VIDEO" && !result.isEmergency
            ? "\n\nReceberá o link da videochamada por SMS após o agendamento."
            : ""
        }

1. Novo pedido
0. Menu inicial`}
      </UssdDialog>
    );
  }

  if (step === "PEDIDOS") {
    if (requests.length === 0) {
      return (
        <UssdDialog code="*123# · Meus pedidos">
          {`Não existem pedidos associados a este número.

0. Menu inicial`}
        </UssdDialog>
      );
    }

    // Lista todos os pedidos do número, não apenas o último.
    const lines = requests
      .slice(0, 5)
      .map((item) => {
        const when = item.scheduledAt
          ? `\n   Marcada: ${formatDateTime(item.scheduledAt)}`
          : "";
        const link =
          item.meetingLink && item.meetingLinkExpiresAt
            ? `\n   Link válido até ${formatTime(item.meetingLinkExpiresAt)}`
            : "";

        return `${item.reference} · ${item.childName}\n   ${
          statusLabels[item.status]
        } · ${priorityLabels[item.priority]}${when}${link}`;
      })
      .join("\n\n");

    return (
      <UssdDialog code="*123# · Meus pedidos">
        {`${lines}

0. Menu inicial`}
      </UssdDialog>
    );
  }

  return (
    <UssdDialog code="*123#">
      {`Sessão terminada.
Obrigado por usar o HGM TelePediatria.`}
    </UssdDialog>
  );
}

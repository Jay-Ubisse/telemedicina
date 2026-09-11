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

import { EmergencyNotice } from "@/components/layout/emergency-notice";
import { UssdDevice, UssdDialog } from "@/components/ussd/ussd-device";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { maputoNeighbourhoods, normalizeNeighbourhood } from "@/lib/data/locations";
import { MAX_AGE_YEARS, ussdSymptomMenu } from "@/lib/data/symptoms";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import type { Consultation } from "@/lib/types/consultation";
import {
  channelLabels,
  shortStatusLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { formatDateTime } from "@/lib/utils/date";
import { screenIntake, validateChildAge } from "@/lib/utils/intake";

type Step =
  | "MENU"
  | "ENCARREGADO"
  | "NOME"
  | "IDADE"
  | "LOCALIZACAO"
  | "OUTRO_BAIRRO"
  | "SINTOMA"
  | "OUTRO_SINTOMA"
  | "CANAL"
  | "OBSERVACOES"
  | "CONFIRMACAO"
  | "CORRIGIR"
  | "RESULTADO"
  | "PEDIDOS"
  | "FIM";

type Draft = {
  guardianName: string;
  childName: string;
  age: string;
  location: string;
  symptoms: string[];
  otherSymptom: string;
  channel: ConsultationChannel | "";
  notes: string;
};

const emptyDraft: Draft = {
  guardianName: "",
  childName: "",
  age: "",
  location: "",
  symptoms: [],
  otherSymptom: "",
  channel: "",
  notes: "",
};

const ITEMS_PER_PAGE = 6;

/** Convenção USSD para paginação; não colide com nenhum número de opção. */
const NEXT_PAGE_KEY = "99";
/** Regresso ao início de uma lista paginada, oferecido na última página. */
const FIRST_PAGE_KEY = "98";

const OTHER_SYMPTOM_KEY = String(ussdSymptomMenu.length);

/** Números "de SIM" pré-configurados no simulador. */
const simCards = [
  { phone: "+258 84 512 3390", label: "Ana Mondlane" },
  { phone: "+258 82 771 4408", label: "Carla Nhaca" },
  { phone: "+258 86 330 9812", label: "Paulo Cossa" },
  { phone: "+258 84 777 1200", label: "Rosa Macamo (conta provisória)" },
  { phone: "+258 84 555 0101", label: "Número não registado" },
];

const OTHER_SIM = "OUTRO";

/**
 * Menu de localização.
 *
 * O bairro chega para organizar o atendimento — não se recolhe rua nem número de
 * porta. A lista deixou de ser fechada: a última opção é «Outro bairro», que
 * abre um campo de texto, como o relatório pede em §6.
 */
const OTHER_LOCATION_KEY = String(maputoNeighbourhoods.length + 1);

const locationMenu = [
  ...maputoNeighbourhoods.map((label, index) => ({
    key: String(index + 1),
    label,
  })),
  { key: OTHER_LOCATION_KEY, label: "Outro bairro" },
];

const channelMenu: { key: string; value: ConsultationChannel; label: string }[] = [
  { key: "1", value: "TEXTO", label: "Mensagens de texto" },
  { key: "2", value: "AUDIO", label: "Chamada de áudio" },
  { key: "3", value: "VIDEO", label: "Videochamada" },
];

/** Campos que a opção «Corrigir dados» permite alterar directamente. */
const correctableFields: { key: string; label: string; step: Step }[] = [
  { key: "1", label: "Nome completo da criança", step: "NOME" },
  { key: "2", label: "Idade da criança", step: "IDADE" },
  { key: "3", label: "Bairro", step: "LOCALIZACAO" },
  { key: "4", label: "Sintoma principal", step: "SINTOMA" },
  { key: "5", label: "Modalidade de atendimento", step: "CANAL" },
  { key: "6", label: "Observações", step: "OBSERVACOES" },
];

/** Últimos 9 dígitos — compara números escritos em formatos diferentes. */
function phoneKey(value: string) {
  return value.replace(/\D/g, "").slice(-9);
}

/** Normaliza um número escrito à mão no simulador. */
function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return "";
  const local = digits.slice(-9);
  return `+258 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

function paginate<T>(items: T[], page: number) {
  return items.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
}

export function UssdView() {
  const hydrated = useHydrated();

  const users = useClinicStore((state) => state.users);
  const children = useClinicStore((state) => state.children);
  const consultations = useClinicStore((state) => state.consultations);
  const createConsultation = useClinicStore((state) => state.createConsultation);

  const [sim, setSim] = useState<string>(simCards[0].phone);
  const [customPhone, setCustomPhone] = useState("");
  const [step, setStep] = useState<Step>("MENU");
  // A pilha só é lida dentro dos updaters funcionais de `setHistory`.
  const [, setHistory] = useState<Step[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [symptomPage, setSymptomPage] = useState(0);
  const [locationPage, setLocationPage] = useState(0);
  /**
   * Quando o utilizador corrige um campo a partir da confirmação, é para a
   * confirmação que regressa — e não para o passo seguinte do formulário.
   */
  const [returnTo, setReturnTo] = useState<Step | null>(null);
  const [result, setResult] = useState<{
    message: string;
    reference: string;
    status: string;
    warning: string | null;
  } | null>(null);

  /**
   * O número é capturado automaticamente pela rede — o utilizador nunca o digita
   * no menu USSD. No simulador é possível escolher um dos cartões
   * pré-configurados ou introduzir qualquer outro número.
   */
  const capturedPhone = sim === OTHER_SIM ? normalizePhone(customPhone) : sim;

  const guardian = useMemo(
    () =>
      capturedPhone
        ? (users.find(
            (user) =>
              user.role === "ENCARREGADO" &&
              phoneKey(user.phone) === phoneKey(capturedPhone),
          ) ?? null)
        : null,
    [users, capturedPhone],
  );

  const myRequests = useMemo(
    () =>
      consultations
        .filter(
          (item) =>
            capturedPhone !== "" &&
            phoneKey(item.phone) === phoneKey(capturedPhone),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [consultations, capturedPhone],
  );

  /**
   * Entrar num passo reinicia a paginação da lista desse passo.
   *
   * Era esta a correcção pedida em §6: ao regressar da idade da criança para o
   * bairro, o menu reaparecia na página onde tinha ficado e a numeração começava
   * em 13, como se faltassem as primeiras opções.
   */
  function resetPagesFor(next: Step) {
    if (next === "LOCALIZACAO") setLocationPage(0);
    if (next === "SINTOMA") setSymptomPage(0);
  }

  function goTo(next: Step) {
    setHistory((stack) => [...stack, step]);
    resetPagesFor(next);
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
        resetPagesFor("MENU");
        setStep("MENU");
        return [];
      }
      const previous = stack[stack.length - 1];
      resetPagesFor(previous);
      setStep(previous);
      return stack.slice(0, -1);
    });
  }

  function reset() {
    setDraft(emptyDraft);
    setInput("");
    setError(null);
    setResult(null);
    setSymptomPage(0);
    setLocationPage(0);
    setHistory([]);
    setReturnTo(null);
    setStep("MENU");
  }

  /**
   * Avança para o passo seguinte — ou regressa à confirmação, se o utilizador
   * estiver apenas a corrigir um campo.
   */
  function advance(next: Step) {
    if (returnTo) {
      const target = returnTo;
      setReturnTo(null);
      setHistory([]);
      setStep(target);
      setInput("");
      setError(null);
      return;
    }
    goTo(next);
  }

  const symptomPages = Math.ceil(ussdSymptomMenu.length / ITEMS_PER_PAGE);
  const locationPages = Math.ceil(locationMenu.length / ITEMS_PER_PAGE);

  const visibleSymptoms = paginate(ussdSymptomMenu, symptomPage);
  const visibleLocations = paginate(locationMenu, locationPage);

  /** Há página seguinte? Só então se oferece «99. Mais opções». */
  const hasNextSymptomPage = symptomPage < symptomPages - 1;
  const hasNextLocationPage = locationPage < locationPages - 1;

  function submit() {
    const value = input.trim();

    // "0" é universal: volta ao menu anterior (excepto no menu inicial).
    if (
      value === "0" &&
      step !== "MENU" &&
      step !== "RESULTADO" &&
      step !== "PEDIDOS"
    ) {
      if (returnTo) {
        const target = returnTo;
        setReturnTo(null);
        setHistory([]);
        setStep(target);
        setInput("");
        setError(null);
        return;
      }
      goBack();
      return;
    }

    if (step === "MENU") {
      if (!capturedPhone) {
        return setError("Introduza um número de telemóvel válido (9 dígitos).");
      }
      // Número novo: recolhe-se primeiro quem é o encarregado, para que a
      // criança fique desde logo associada a uma pessoa e não a um número.
      if (value === "1") return goTo(guardian ? "NOME" : "ENCARREGADO");
      if (value === "2") return goTo("PEDIDOS");
      if (value === "3") return setStep("FIM");
      return setError("Opção inválida.");
    }

    if (step === "ENCARREGADO") {
      if (value.length < 3) {
        return setError("Digite o nome do encarregado de educação.");
      }
      setDraft((current) => ({ ...current, guardianName: value }));
      return goTo("NOME");
    }

    if (step === "NOME") {
      if (value.length < 3) return setError("Digite o nome completo da criança.");
      setDraft((current) => ({ ...current, childName: value }));
      return advance("IDADE");
    }

    if (step === "IDADE") {
      const validation = validateChildAge(value);
      if (!validation.valid) return setError(validation.error!);
      setDraft((current) => ({ ...current, age: value }));
      return advance("LOCALIZACAO");
    }

    if (step === "LOCALIZACAO") {
      if (value === NEXT_PAGE_KEY) {
        if (!hasNextLocationPage) {
          return setError(
            "Não existem mais opções. Escolha um número da lista ou digite 0 para voltar.",
          );
        }
        setLocationPage((page) => page + 1);
        setInput("");
        setError(null);
        return;
      }

      if (value === FIRST_PAGE_KEY) {
        if (locationPage === 0) {
          return setError("Já está na primeira página da lista.");
        }
        setLocationPage(0);
        setInput("");
        setError(null);
        return;
      }

      if (value === OTHER_LOCATION_KEY) {
        return goTo("OUTRO_BAIRRO");
      }

      const bairro = locationMenu.find((item) => item.key === value);
      if (!bairro) {
        return setError(
          hasNextLocationPage
            ? "Digite o número do bairro ou 99 para mais opções."
            : "Digite o número do bairro da lista.",
        );
      }

      setDraft((current) => ({ ...current, location: bairro.label }));
      return advance("SINTOMA");
    }

    if (step === "OUTRO_BAIRRO") {
      if (value.length < 3) {
        return setError("Escreva o nome do bairro onde a criança se encontra.");
      }
      setDraft((current) => ({
        ...current,
        location: normalizeNeighbourhood(value),
      }));
      return advance("SINTOMA");
    }

    if (step === "SINTOMA") {
      if (value === NEXT_PAGE_KEY) {
        if (!hasNextSymptomPage) {
          return setError(
            "Não existem mais opções. Escolha um número da lista ou digite 0 para voltar.",
          );
        }
        setSymptomPage((page) => page + 1);
        setInput("");
        setError(null);
        return;
      }

      if (value === FIRST_PAGE_KEY) {
        if (symptomPage === 0) {
          return setError("Já está na primeira página da lista.");
        }
        setSymptomPage(0);
        setInput("");
        setError(null);
        return;
      }

      if (value === OTHER_SYMPTOM_KEY) {
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
      return advance("CANAL");
    }

    if (step === "OUTRO_SINTOMA") {
      if (value.length < 3) return setError("Descreva o sintoma da criança.");
      setDraft((current) => ({ ...current, otherSymptom: value }));
      return advance("CANAL");
    }

    if (step === "CANAL") {
      const option = channelMenu.find((item) => item.key === value);
      if (!option) return setError("Digite 1, 2 ou 3.");
      setDraft((current) => ({ ...current, channel: option.value }));
      return advance("OBSERVACOES");
    }

    if (step === "OBSERVACOES") {
      setDraft((current) => ({
        ...current,
        notes: value === "9" ? "" : value,
      }));
      return advance("CONFIRMACAO");
    }

    if (step === "CONFIRMACAO") {
      // «Corrigir dados» passou a abrir um menu de escolha do campo, em vez de
      // reiniciar o preenchimento desde o primeiro campo (§6 do relatório).
      if (value === "2") return goTo("CORRIGIR");

      if (value !== "1") {
        return setError(
          "Digite 1 para confirmar e autorizar, ou 2 para corrigir dados.",
        );
      }

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
        fallbackGuardianName: guardian?.name ?? draft.guardianName,
        phone: capturedPhone,
        location: draft.location,
        symptoms: draft.symptoms,
        otherSymptom: draft.otherSymptom,
        notes: draft.notes,
        channel: (draft.channel || "AUDIO") as ConsultationChannel,
        source: "USSD",
        // Confirmar o pedido no menu é o consentimento do encarregado.
        consent: true,
      });

      if (!created.ok) return setError(created.error);

      const screening = screenIntake({
        symptoms: draft.symptoms,
        otherSymptom: draft.otherSymptom,
      });

      setResult({
        message: created.data.message,
        reference: created.data.consultation.reference,
        status: statusLabels[created.data.consultation.status],
        warning: screening.warning,
      });
      setHistory([]);
      setReturnTo(null);
      setStep("RESULTADO");
      setInput("");
      return;
    }

    if (step === "CORRIGIR") {
      const field = correctableFields.find((item) => item.key === value);
      if (!field) {
        return setError("Digite o número do dado que pretende alterar.");
      }
      setReturnTo("CONFIRMACAO");
      resetPagesFor(field.step);
      setHistory([]);
      setStep(field.step);
      setInput("");
      setError(null);
      return;
    }

    if (step === "RESULTADO") {
      if (value === "1") {
        setDraft((current) => ({ ...emptyDraft, guardianName: current.guardianName }));
        setResult(null);
        setSymptomPage(0);
        setLocationPage(0);
        setHistory([]);
        setReturnTo(null);
        setStep(guardian ? "NOME" : "ENCARREGADO");
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
              Simulação do protótipo
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Simulador USSD · <span className="font-ussd">*123#</span>
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Mostra como poderia ser solicitada uma teleconsulta num telemóvel
              sem acesso à Internet. Cada ecrã recebe um único campo e o pedido
              submetido entra na fila de triagem do painel clínico.
            </p>
          </div>

          {/* Aviso com a redacção aprovada no relatório (§6). */}
          <Alert variant="warning">
            <Info />
            <AlertTitle>Funcionalidade demonstrativa</AlertTitle>
            <AlertDescription>
              Esta funcionalidade é uma simulação integrada no protótipo
              académico. O código *123# é apenas demonstrativo e ainda não está
              disponível para utilização direta num telemóvel.
            </AlertDescription>
          </Alert>

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
                <SelectItem value={OTHER_SIM}>Outro número…</SelectItem>
              </SelectContent>
            </Select>

            {sim === OTHER_SIM ? (
              <div className="mt-3">
                <Label htmlFor="sim-custom" className="text-sm font-semibold">
                  Número do cartão
                </Label>
                <Input
                  id="sim-custom"
                  type="tel"
                  inputMode="tel"
                  value={customPhone}
                  onChange={(event) => {
                    setCustomPhone(event.target.value);
                    reset();
                  }}
                  placeholder="+258 84 000 0000"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {capturedPhone
                    ? guardian
                      ? `Número registado em nome de ${guardian.name}.`
                      : "Número novo: o menu vai perguntar quem é o encarregado de educação e criar a ficha da família."
                    : "Introduza 9 dígitos (ex.: 84 000 0000)."}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
            <h2 className="font-bold tracking-tight">Regras aplicadas</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                `Serviço exclusivo para crianças dos 0 aos ${MAX_AGE_YEARS} anos.`,
                "Digite 0 em qualquer ecrã para voltar ao passo anterior.",
                "A plataforma não classifica o pedido: depois da submissão, fica em «Aguardando triagem» até ser analisado por um profissional de saúde.",
                "A lista de bairros não é fechada — a última opção permite escrever um bairro que não conste da lista.",
                "Nas listas com várias páginas, «99. Mais opções» só aparece quando existe mesmo uma página seguinte.",
                "«Corrigir dados» permite escolher o campo a alterar, sem reiniciar o preenchimento.",
                "Um número ainda não registado cria a ficha do encarregado e liga-lhe a criança do pedido.",
                "As notificações do pedido são simuladas dentro da plataforma — não há envio real de SMS.",
              ].map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <EmergencyNotice />
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
                      onChange={(event) => {
                        setInput(event.target.value);
                        // A mensagem de erro deixa de ser aplicável assim que o
                        // utilizador corrige a resposta (§12 do relatório).
                        if (error) setError(null);
                      }}
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
              visibleLocations={visibleLocations}
              hasNextSymptomPage={hasNextSymptomPage}
              hasNextLocationPage={hasNextLocationPage}
              symptomPage={symptomPage}
              locationPage={locationPage}
              correcting={returnTo !== null}
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
  visibleLocations: { key: string; label: string }[];
  hasNextSymptomPage: boolean;
  hasNextLocationPage: boolean;
  symptomPage: number;
  locationPage: number;
  correcting: boolean;
  result: {
    message: string;
    reference: string;
    status: string;
    warning: string | null;
  } | null;
  requests: Consultation[];
};

/**
 * Rodapé de uma lista paginada.
 *
 * «99. Mais opções» só existe quando há mesmo uma página seguinte. Na última
 * página oferece-se «98. Primeiras opções», em vez de um 99 que dava a volta à
 * lista e confundia o utilizador (§6 do relatório).
 */
function pagerLines(hasNext: boolean, page: number) {
  const lines: string[] = [];
  if (hasNext) lines.push(`${NEXT_PAGE_KEY}. Mais opções`);
  else if (page > 0) lines.push(`${FIRST_PAGE_KEY}. Primeiras opções`);
  return lines;
}

function UssdScreen({
  step,
  draft,
  phone,
  guardianName,
  visibleSymptoms,
  visibleLocations,
  hasNextSymptomPage,
  hasNextLocationPage,
  symptomPage,
  locationPage,
  correcting,
  result,
  requests,
}: ScreenProps) {
  const backLine = correcting ? "0. Voltar à confirmação" : "0. Voltar";

  if (step === "MENU") {
    return (
      <UssdDialog code="*123#">
        {`HGM TelePediatria
Número: ${phone || "não detectado"}
${guardianName ?? "Número ainda não registado"}

1. Solicitar teleconsulta
2. Ver os meus pedidos
3. Sair`}
      </UssdDialog>
    );
  }

  if (step === "ENCARREGADO") {
    return (
      <UssdDialog code="*123# · Encarregado">
        {`Este número ainda não está registado.

Nome do encarregado de educação:

0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "NOME") {
    return (
      <UssdDialog code="*123# · 1/6">
        {`${draft.guardianName ? `Encarregado: ${draft.guardianName}\n\n` : ""}Nome completo da criança:

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "IDADE") {
    return (
      <UssdDialog code="*123# · 2/6">
        {`Criança: ${draft.childName}

Idade da criança (0-${MAX_AGE_YEARS} anos):

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "LOCALIZACAO") {
    const options = visibleLocations
      .map((item) => `${item.key}. ${item.label}`)
      .join("\n");
    const pager = pagerLines(hasNextLocationPage, locationPage);

    return (
      <UssdDialog code="*123# · 3/6">
        {[`Bairro (cidade de Maputo):`, options, ...pager, backLine].join("\n")}
      </UssdDialog>
    );
  }

  if (step === "OUTRO_BAIRRO") {
    return (
      <UssdDialog code="*123# · 3/6">
        {`Escreva o nome do bairro:

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "SINTOMA") {
    const options = visibleSymptoms
      .map((item) => `${item.key}. ${item.label}`)
      .join("\n");
    const pager = pagerLines(hasNextSymptomPage, symptomPage);

    return (
      <UssdDialog code="*123# · 4/6">
        {[`Sintoma principal:`, options, ...pager, backLine].join("\n")}
      </UssdDialog>
    );
  }

  if (step === "OUTRO_SINTOMA") {
    return (
      <UssdDialog code="*123# · 4/6">
        {`Descreva o sintoma da criança:

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "CANAL") {
    return (
      <UssdDialog code="*123# · 5/6">
        {`Modalidade de atendimento:
${channelMenu.map((item) => `${item.key}. ${item.label}`).join("\n")}

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "OBSERVACOES") {
    return (
      <UssdDialog code="*123# · 6/6">
        {`Observações (opcional):
Escreva ou digite 9 para saltar.

${backLine}`}
      </UssdDialog>
    );
  }

  if (step === "CONFIRMACAO") {
    const symptom = draft.otherSymptom || draft.symptoms.join(", ") || "—";

    return (
      <UssdDialog code="*123# · Confirmar">
        {`Confirme o pedido:${
          guardianName || draft.guardianName
            ? `\nEncarregado: ${guardianName ?? draft.guardianName}`
            : ""
        }
Criança: ${draft.childName}
Idade: ${draft.age} anos
Bairro: ${draft.location}
Sintoma: ${symptom}
Modalidade: ${draft.channel ? channelLabels[draft.channel] : "—"}
Obs.: ${draft.notes || "sem observações"}

Ao confirmar, autoriza a realização da teleconsulta.

1. Confirmar e autorizar
2. Corrigir dados
0. Voltar`}
      </UssdDialog>
    );
  }

  if (step === "CORRIGIR") {
    return (
      <UssdDialog code="*123# · Corrigir">
        {`Que dado pretende alterar?
${correctableFields.map((item) => `${item.key}. ${item.label}`).join("\n")}

0. Voltar à confirmação`}
      </UssdDialog>
    );
  }

  if (step === "RESULTADO" && result) {
    return (
      <UssdDialog code="*123# · Resultado" tone="success">
        {`${result.message}

Referência: ${result.reference}
Estado: ${result.status}${result.warning ? `\n\n${result.warning}` : ""}

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
        const doctor = item.assignedDoctorName
          ? `\n   Pediatra: ${item.assignedDoctorName}`
          : "";

        return `${item.reference} · ${item.childName}\n   ${
          shortStatusLabels[item.status]
        }${doctor}${when}`;
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

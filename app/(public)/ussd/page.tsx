"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { UssdShell } from "@/components/ussd/ussd-shell";
import { UssdSingleInputScreen } from "@/components/ussd/ussd-single-input-screen";
import { Button } from "@/components/ui/button";
import { useTelemedicineStore } from "@/lib/store/telemedicine-store";
import type { UssdFormData, UssdStep } from "@/lib/types/ussd";
import { buildTeleconsultationFromUssd } from "@/lib/utils/ussd";
import { ussdSexMap, ussdSymptomMap } from "@/lib/utils/ussd-options";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";
import { buildSymptomsList, getPriorityFromSymptoms } from "@/lib/utils/ussd";

const initialForm: UssdFormData = {
  patientName: "",
  phone: "",
  age: "",
  sex: "",
  province: "",
  district: "",
  symptoms: [],
  otherSymptoms: "",
  notes: "",
};

export default function UssdPage() {
  const router = useRouter();
  const addTeleconsultation = useTelemedicineStore(
    (state) => state.addTeleconsultation,
  );
  const teleconsultations = useTelemedicineStore(
    (state) => state.teleconsultations,
  );

  const [step, setStep] = useState<UssdStep>("MENU");
  const [input, setInput] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [form, setForm] = useState<UssdFormData>(initialForm);

  function resetFlow() {
    setForm(initialForm);
    setInput("");
    setLookupPhone("");
    setStep("MENU");
  }

  function goDashboard() {
    router.push("/dashboard");
  }

  function submitCurrentStep() {
    const value = input.trim();

    if (step === "MENU") {
      if (value === "1") {
        setInput("");
        setStep("PATIENT_NAME");
        return;
      }

      if (value === "2") {
        setInput("");
        setStep("STATUS_PHONE");
        return;
      }

      resetFlow();
      return;
    }

    if (step === "STATUS_PHONE") {
      if (!value) return;
      setLookupPhone(value);
      setInput("");
      setStep("STATUS_RESULT");
      return;
    }

    if (step === "PATIENT_NAME") {
      if (!value) return;
      setForm((prev) => ({ ...prev, patientName: value }));
      setInput("");
      setStep("PATIENT_PHONE");
      return;
    }

    if (step === "PATIENT_PHONE") {
      if (!value) return;
      setForm((prev) => ({ ...prev, phone: value }));
      setInput("");
      setStep("PATIENT_AGE");
      return;
    }

    if (step === "PATIENT_AGE") {
      if (!value) return;
      setForm((prev) => ({ ...prev, age: value }));
      setInput("");
      setStep("PATIENT_SEX");
      return;
    }

    if (step === "PATIENT_SEX") {
      const sex = ussdSexMap[value];
      if (!sex) return;
      setForm((prev) => ({ ...prev, sex }));
      setInput("");
      setStep("PATIENT_PROVINCE");
      return;
    }

    if (step === "PATIENT_PROVINCE") {
      if (!value) return;
      setForm((prev) => ({ ...prev, province: value }));
      setInput("");
      setStep("PATIENT_DISTRICT");
      return;
    }

    if (step === "PATIENT_DISTRICT") {
      if (!value) return;
      setForm((prev) => ({ ...prev, district: value }));
      setInput("");
      setStep("PATIENT_SYMPTOM");
      return;
    }

    if (step === "PATIENT_SYMPTOM") {
      if (value === "10") {
        setInput("");
        setStep("PATIENT_OTHER_SYMPTOM");
        return;
      }

      const symptom = ussdSymptomMap[value];
      if (!symptom) return;

      setForm((prev) => ({ ...prev, symptoms: [symptom] }));
      setInput("");
      setStep("PATIENT_NOTES");
      return;
    }

    if (step === "PATIENT_OTHER_SYMPTOM") {
      if (!value) return;
      setForm((prev) => ({
        ...prev,
        symptoms: [],
        otherSymptoms: value,
      }));
      setInput("");
      setStep("PATIENT_NOTES");
      return;
    }

    if (step === "PATIENT_NOTES") {
      setForm((prev) => ({
        ...prev,
        notes: value === "0" ? "" : value,
      }));
      setInput("");
      setStep("CONFIRMATION");
      return;
    }
    if (step === "CONFIRMATION") {
      if (value === "1") {
        const payload = buildTeleconsultationFromUssd(form);
        addTeleconsultation(payload);
        setInput("");
        setStep("SUCCESS");
        return;
      }

      if (value === "2" || value === "0") {
        resetFlow();
      }
    }
  }

  const latestMatch = useMemo(() => {
    if (!lookupPhone.trim()) return null;

    const matches = teleconsultations
      .filter((item) => item.phone.includes(lookupPhone.trim()))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return matches[0] ?? null;
  }, [lookupPhone, teleconsultations]);

  const symptomsPreview = buildSymptomsList(form);
  const estimatedPriority = getPriorityFromSymptoms(symptomsPreview);

  return (
    <main className="min-h-screen bg-muted/30">
      <PageShell>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Sobre a simulação</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta interface simula um atendimento USSD real, com apenas um
                campo por tela. Ao concluir, a teleconsulta é enviada para o
                dashboard em memória.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">Fluxo</h3>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>1. Menu inicial</p>
                <p>2. Nome</p>
                <p>3. Telefone</p>
                <p>4. Idade</p>
                <p>5. Sexo</p>
                <p>6. Província</p>
                <p>7. Distrito</p>
                <p>8. Sintoma principal</p>
                <p>9. Observações</p>
                <p>10. Confirmação</p>
              </div>
            </div>
            <Button
              variant="default"
              className="hidden md:block"
              onClick={goDashboard}
            >
              Ver dashboard
            </Button>
          </div>

          <UssdShell>
            {step === "MENU" && (
              <UssdSingleInputScreen
                title="USSD • Menu inicial"
                body={
                  <div className="space-y-2">
                    <p>*123#</p>
                    <p>Bem-vindo à Telemedicina Demo</p>
                    <p>1. Solicitar teleconsulta</p>
                    <p>2. Ver estado do pedido</p>
                    <p>0. Cancelar</p>
                  </div>
                }
                value={input}
                onChange={setInput}
                placeholder="Digite uma opção"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "STATUS_PHONE" && (
              <UssdSingleInputScreen
                title="USSD • Estado do pedido"
                body={<p>Digite o número de telefone usado no pedido</p>}
                value={input}
                onChange={setInput}
                placeholder="84xxxxxxx"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "STATUS_RESULT" && (
              <div className="flex min-h-[560px] flex-col">
                <div className="border-b bg-black px-5 py-4 text-green-400">
                  <p className="text-sm font-semibold">USSD • Resultado</p>
                </div>

                <div className="flex-1 space-y-4 px-5 py-5">
                  {latestMatch ? (
                    <div className="rounded-2xl border p-4 text-sm">
                      <p className="font-semibold">{latestMatch.patientName}</p>
                      <p className="mt-1 text-muted-foreground">
                        {latestMatch.phone}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={latestMatch.status} />
                        <PriorityBadge priority={latestMatch.priority} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                      Nenhum pedido encontrado para este número.
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={resetFlow}>Voltar ao menu</Button>
                  </div>
                </div>
              </div>
            )}

            {step === "PATIENT_NAME" && (
              <UssdSingleInputScreen
                title="USSD • Nome completo"
                body={<p>Digite o seu nome completo</p>}
                value={input}
                onChange={setInput}
                placeholder="Ex.: Maria José"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_PHONE" && (
              <UssdSingleInputScreen
                title="USSD • Telefone"
                body={<p>Digite o seu número de telefone</p>}
                value={input}
                onChange={setInput}
                placeholder="84xxxxxxx"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_AGE" && (
              <UssdSingleInputScreen
                title="USSD • Idade"
                body={<p>Digite a sua idade</p>}
                value={input}
                onChange={setInput}
                placeholder="Ex.: 29"
                inputType="number"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_SEX" && (
              <UssdSingleInputScreen
                title="USSD • Sexo"
                body={
                  <div className="space-y-2">
                    <p>Selecione o sexo</p>
                    <p>1. Masculino</p>
                    <p>2. Feminino</p>
                  </div>
                }
                value={input}
                onChange={setInput}
                placeholder="Digite 1 ou 2"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_PROVINCE" && (
              <UssdSingleInputScreen
                title="USSD • Província"
                body={<p>Digite a sua província</p>}
                value={input}
                onChange={setInput}
                placeholder="Ex.: Maputo"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_DISTRICT" && (
              <UssdSingleInputScreen
                title="USSD • Distrito"
                body={<p>Digite o seu distrito</p>}
                value={input}
                onChange={setInput}
                placeholder="Ex.: KaMpfumo"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_SYMPTOM" && (
              <UssdSingleInputScreen
                title="USSD • Sintoma principal"
                body={
                  <div className="space-y-1 text-sm">
                    <p>Selecione o sintoma principal</p>
                    <p>1. Febre</p>
                    <p>2. Tosse</p>
                    <p>3. Dor de cabeça</p>
                    <p>4. Dor no peito</p>
                    <p>5. Dificuldade respiratória</p>
                    <p>6. Tontura</p>
                    <p>7. Fraqueza</p>
                    <p>8. Dor abdominal forte</p>
                    <p>9. Perda de consciência</p>
                    <p>10. Outro</p>
                  </div>
                }
                value={input}
                onChange={setInput}
                placeholder="Digite uma opção"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_OTHER_SYMPTOM" && (
              <UssdSingleInputScreen
                title="USSD • Outro sintoma"
                body={<p>Descreva o sintoma principal</p>}
                value={input}
                onChange={setInput}
                placeholder="Digite o sintoma"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "PATIENT_NOTES" && (
              <UssdSingleInputScreen
                title="USSD • Observações"
                body={<p>Digite uma observação adicional ou escreva "0"</p>}
                value={input}
                onChange={setInput}
                placeholder='Ex.: sintomas desde ontem / "0"'
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
              />
            )}

            {step === "CONFIRMATION" && (
              <UssdSingleInputScreen
                title="USSD • Confirmar pedido"
                body={
                  <div className="space-y-2 text-sm">
                    <p>Nome: {form.patientName}</p>
                    <p>Telefone: {form.phone}</p>
                    <p>Idade: {form.age}</p>
                    <p>Sexo: {form.sex}</p>
                    <p>Província: {form.province}</p>
                    <p>Distrito: {form.district}</p>
                    <p>
                      Sintoma:{" "}
                      {symptomsPreview.length > 0
                        ? symptomsPreview.join(", ")
                        : "N/D"}
                    </p>
                    <p>Observação: {form.notes || "Sem observação"}</p>
                    <p>Prioridade estimada: {estimatedPriority}</p>
                    <div className="pt-2">
                      <p>1. Confirmar</p>
                      <p>2. Cancelar</p>
                    </div>
                  </div>
                }
                value={input}
                onChange={setInput}
                placeholder="Digite 1 ou 2"
                onSubmit={submitCurrentStep}
                onCancel={resetFlow}
                submitLabel="Enviar"
              />
            )}

            {step === "SUCCESS" && (
              <div className="flex min-h-[560px] flex-col">
                <div className="border-b bg-black px-5 py-4 text-green-400">
                  <p className="text-sm font-semibold">USSD • Sucesso</p>
                </div>

                <div className="flex-1 space-y-4 px-5 py-5">
                  <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                    <p className="font-semibold">
                      Pedido submetido com sucesso
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      A teleconsulta foi registada e enviada para o dashboard do
                      médico.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4 text-sm">
                    <p>Paciente: {form.patientName}</p>
                    <p>Telefone: {form.phone}</p>
                    <p>Prioridade: {estimatedPriority}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={resetFlow}>Novo pedido</Button>
                  </div>
                </div>
              </div>
            )}
          </UssdShell>
        </div>
        <Button
          variant="default"
          className="block md:hidden"
          onClick={goDashboard}
        >
          Ver dashboard
        </Button>
      </PageShell>
    </main>
  );
}

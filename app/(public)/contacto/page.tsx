import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, PhoneCall, Smartphone } from "lucide-react";

import { DocumentPage } from "@/components/marketing/document-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contactos do serviço de telepediatria do Hospital Geral de Mavalane: apoio à plataforma, Simulador USSD e horários de atendimento.",
};

const channels = [
  {
    icon: PhoneCall,
    label: "Emergência",
    value: "Serviços de emergência oficiais",
    detail:
      "Em caso de sintomas graves, dirija-se imediatamente à unidade sanitária mais próxima ou contacte os serviços de emergência oficialmente disponíveis.",
  },
  {
    icon: Smartphone,
    label: "Simulador USSD",
    value: "*123# (demonstrativo)",
    detail:
      "Simulação integrada no protótipo académico. O código é apenas demonstrativo e ainda não está disponível para utilização direta num telemóvel.",
  },
  {
    icon: Mail,
    label: "Apoio à plataforma",
    value: "telepediatria@hgm.mz",
    detail:
      "Dúvidas sobre a conta, acesso ao histórico clínico ou correcção de dados pessoais.",
  },
  {
    icon: MapPin,
    label: "Hospital Geral de Mavalane",
    value: "Av. de Moçambique, Mavalane · Maputo",
    detail: "Serviço de Pediatria, piso 1.",
  },
  {
    icon: Clock,
    label: "Turnos de teleconsulta",
    value: "07h–13h · 13h–19h · 19h–07h",
    detail:
      "Fora do turno, os pedidos ficam na fila de triagem e são analisados por um profissional de saúde por ordem de chegada.",
  },
];

export default function ContactoPage() {
  return (
    <DocumentPage
      eyebrow="Falar com o HGM"
      title="Contactos do serviço de telepediatria."
      intro="A telepediatria não substitui os serviços de emergência. Em caso de sintomas graves, dirija-se imediatamente à unidade sanitária mais próxima ou contacte os serviços de emergência oficialmente disponíveis. Para tudo o resto, use um dos canais abaixo."
      sections={[
        {
          heading: "Antes de contactar",
          bullets: [
            "Se a criança apresenta convulsões, dificuldade em respirar, perda de consciência ou sangramento, não aguarde resposta: dirija-se de imediato a uma unidade sanitária.",
            "Para saber o estado de um pedido, entre na sua conta — ou experimente o percurso no Simulador USSD, em «Ver os meus pedidos».",
            "Tenha à mão a referência do pedido (por exemplo, R-1042) — é por ela que a equipa localiza o processo.",
          ],
        },
      ]}
    >
      <section className="pt-2">
        <h2 className="font-heading text-xl font-bold tracking-[-0.02em]">
          Canais disponíveis
        </h2>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {channels.map((channel) => (
            <div key={channel.label} className="bg-card p-5">
              <dt className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <channel.icon className="size-4" />
                </span>
                <span className="text-[0.625rem] tracking-[0.14em] text-muted-foreground font-semibold uppercase">
                  {channel.label}
                </span>
              </dt>
              <dd className="mt-3">
                <p className="font-heading text-lg font-bold tracking-tight">
                  {channel.value}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {channel.detail}
                </p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="xl" className="rounded-lg">
            <Link href="/registo">Criar conta</Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="rounded-lg">
            <Link href="/ussd">Abrir Simulador USSD</Link>
          </Button>
        </div>
      </section>
    </DocumentPage>
  );
}

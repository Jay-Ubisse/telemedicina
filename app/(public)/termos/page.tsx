import type { Metadata } from "next";

import { DocumentPage } from "@/components/marketing/document-page";

export const metadata: Metadata = {
  title: "Termos de utilização",
  description:
    "Condições de utilização da plataforma de telepediatria do Hospital Geral de Mavalane.",
};

export default function TermosPage() {
  return (
    <DocumentPage
      eyebrow="Condições do serviço"
      title="Termos de utilização da plataforma."
      intro="A telepediatria do HGM é um complemento ao atendimento presencial. Estes termos descrevem quem pode usar o serviço, o que ele faz e o que não faz."
      updatedAt="Agosto de 2026"
      sections={[
        {
          heading: "Objecto do serviço",
          paragraphs: [
            "A plataforma permite solicitar teleconsultas pediátricas ao Hospital Geral de Mavalane por telemóvel, com ou sem internet, através do canal USSD *123# ou da área web.",
            "O serviço destina-se a crianças dos 0 aos 15 anos residentes na cidade de Maputo.",
          ],
        },
        {
          heading: "O que o serviço não substitui",
          paragraphs: [
            "A teleconsulta não substitui a consulta presencial, o exame físico, os meios complementares de diagnóstico nem os serviços de urgência e emergência.",
            "Perante sintomas críticos — convulsões, falta de ar, perda de consciência, sangramento intenso ou dor abdominal muito forte — o pedido é imediatamente encaminhado e o encarregado deve dirigir-se à unidade sanitária mais próxima.",
          ],
        },
        {
          heading: "Conta e responsabilidade do encarregado",
          bullets: [
            "A conta é pessoal e o encarregado é responsável pela veracidade dos dados que indica.",
            "Cada criança só pode ter um pedido em aberto de cada vez, para não duplicar a fila de atendimento.",
            "O encarregado compromete-se a estar contactável no número indicado à hora marcada.",
            "A partilha das credenciais de acesso com terceiros não é permitida.",
          ],
        },
        {
          heading: "Triagem e prioridades",
          paragraphs: [
            "Cada pedido é classificado automaticamente no momento em que chega: normal, urgente, crítico ou «avaliação necessária» quando o sintoma é descrito em texto livre.",
            "A classificação automática é uma ordenação de fila, não um diagnóstico. A decisão clínica é sempre de um pediatra do HGM.",
          ],
        },
        {
          heading: "Teleconsulta e link da videochamada",
          paragraphs: [
            "Nas teleconsultas por videochamada, o link é gerado no agendamento e enviado por SMS para o número do encarregado.",
            "O link expira dez minutos depois da hora marcada e deixa de ser válido assim que a consulta é concluída ou o caso é encaminhado. Um link expirado pode ser reenviado pelo pediatra responsável, gerando um novo prazo.",
          ],
        },
        {
          heading: "Registo clínico",
          paragraphs: [
            "As notas clínicas ficam no histórico da criança e a orientação é partilhada com o encarregado de educação. O registo clínico não é apagado — contas e crianças com histórico são arquivadas ou desactivadas.",
          ],
        },
        {
          heading: "Disponibilidade",
          paragraphs: [
            "O serviço funciona por turnos de escala dos pediatras do HGM. Fora dos turnos, os pedidos permanecem na fila de triagem e são atendidos na sequência da respectiva prioridade.",
          ],
        },
        {
          heading: "Natureza desta versão",
          paragraphs: [
            "Esta versão é um protótipo institucional de demonstração. Os dados apresentados são fictícios, não existe envio real de SMS nem ligação a sistemas hospitalares, e nenhuma informação aqui introduzida deve ser considerada um registo clínico verdadeiro.",
          ],
        },
      ]}
    />
  );
}

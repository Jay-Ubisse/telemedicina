import type { Metadata } from "next";

import { DocumentPage } from "@/components/marketing/document-page";
import {
  EMERGENCY_NOTICE,
  INTEROPERABILITY_NOTE,
} from "@/lib/data/symptoms";

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
      updatedAt="Setembro de 2026"
      sections={[
        {
          heading: "Objecto do serviço",
          paragraphs: [
            "A plataforma permite solicitar teleconsultas pediátricas ao Hospital Geral de Mavalane através da área web. O Simulador USSD demonstra como poderia ser solicitada uma teleconsulta num telemóvel sem acesso à Internet — o código *123# é apenas demonstrativo e ainda não está disponível para utilização direta num telemóvel.",
            "O serviço destina-se a crianças dos 0 aos 15 anos residentes na cidade de Maputo.",
          ],
        },
        {
          heading: "O que o serviço não substitui",
          paragraphs: [
            "A teleconsulta não substitui a consulta presencial, o exame físico nem os meios complementares de diagnóstico.",
            EMERGENCY_NOTICE,
            "Quando o pedido descreve sintomas potencialmente graves, a plataforma apresenta um aviso preventivo. Esse aviso não é uma triagem nem um diagnóstico.",
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
            "A plataforma não realiza triagem clínica nem atribui prioridades automaticamente. Depois de submetido, o pedido fica no estado «Aguardando triagem».",
            "A triagem é realizada por um profissional de saúde do HGM, que analisa os sintomas e as informações submetidas, atribui a prioridade, regista observações, justifica qualquer alteração e decide entre autorizar a continuidade para teleconsulta ou encaminhar para atendimento presencial.",
            "Depois da triagem, o perfil administrativo consulta a disponibilidade e atribui o pedido a um pediatra, que define ou confirma o horário do atendimento.",
          ],
        },
        {
          heading: "Teleconsulta, consentimento e acesso à sala",
          paragraphs: [
            "A teleconsulta pode ser realizada por mensagens de texto, chamada de áudio ou videochamada, conforme a modalidade definida no agendamento.",
            "A teleconsulta só é realizada com o consentimento do encarregado de educação, recolhido na submissão do pedido. A consulta não é gravada automaticamente.",
            "Nas videochamadas, o acesso à sala é gerado no agendamento e comunicado ao encarregado por notificação interna da plataforma. Expira dez minutos depois da hora marcada e deixa de ser válido assim que a consulta é concluída, o caso é encaminhado ou o pedido é cancelado. O pediatra responsável pode disponibilizar um novo acesso, gerando um novo prazo.",
          ],
        },
        {
          heading: "Registo clínico",
          paragraphs: [
            "As notas clínicas ficam no histórico da criança e a orientação é partilhada com o encarregado de educação. O registo clínico não é apagado — contas e crianças com histórico são arquivadas ou desactivadas.",
            "A prescrição é criada ou alterada apenas pelo pediatra responsável e visualizada apenas por ele e pelo encarregado responsável pela respectiva criança. Toda a prescrição gerada nesta versão é demonstrativa e não deve ser utilizada para fins clínicos reais.",
          ],
        },
        {
          heading: "Disponibilidade",
          paragraphs: [
            "O serviço funciona por turnos de escala dos pediatras do HGM. Cada pediatra indica as suas janelas de atendimento — dia, hora inicial e final, duração prevista, modalidade, estado e observações — e não consta como disponível fora do turno registado, salvo se tiver registado uma disponibilidade adicional.",
            "O encarregado pode indicar um pediatra de preferência. A preferência fica sujeita à disponibilidade e não garante atendimento pelo profissional selecionado. Se estiver indisponível, o sistema pode sugerir outro pediatra ou permitir aguardar uma data disponível.",
          ],
        },
        {
          heading: "Natureza desta versão",
          paragraphs: [
            "Esta versão é um protótipo académico de demonstração. Os dados apresentados são fictícios, não existe qualquer envio externo de mensagens — todas as notificações são simuladas dentro da plataforma — e nenhuma informação aqui introduzida deve ser considerada um registo clínico verdadeiro.",
            INTEROPERABILITY_NOTE,
          ],
        },
      ]}
    />
  );
}

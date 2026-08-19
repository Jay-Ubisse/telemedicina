import type { Metadata } from "next";

import { DocumentPage } from "@/components/marketing/document-page";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como o Hospital Geral de Mavalane recolhe, utiliza e protege os dados clínicos das crianças atendidas na plataforma de telepediatria.",
};

export default function PrivacidadePage() {
  return (
    <DocumentPage
      eyebrow="Protecção de dados"
      title="Política de privacidade e confidencialidade clínica."
      intro="A informação de uma criança é das mais sensíveis que um sistema de saúde guarda. Esta página descreve o que a plataforma recolhe, quem tem acesso a quê e durante quanto tempo a informação é conservada."
      updatedAt="Agosto de 2026"
      sections={[
        {
          heading: "Dados recolhidos",
          paragraphs: [
            "A plataforma recolhe apenas o que é necessário para triar e realizar a teleconsulta pediátrica.",
          ],
          bullets: [
            "Identificação do encarregado de educação: nome, número de telemóvel, documento de identificação e bairro de residência.",
            "Identificação da criança: nome, data de nascimento e sexo.",
            "Informação clínica: sintomas indicados, observações do encarregado, notas clínicas, orientação e anexos partilhados.",
            "Dados técnicos do pedido: canal escolhido, origem (USSD ou web), data e hora de submissão e de agendamento.",
          ],
        },
        {
          heading: "Finalidade do tratamento",
          paragraphs: [
            "Os dados são tratados para triar o pedido segundo a gravidade dos sintomas, agendar e realizar a teleconsulta, registar a orientação clínica no histórico da criança e produzir indicadores institucionais do serviço.",
            "Os indicadores institucionais são sempre agregados: não identificam crianças nem encarregados.",
          ],
        },
        {
          heading: "Quem acede à informação",
          bullets: [
            "O encarregado de educação acede aos pedidos, ao histórico e às orientações das crianças da sua conta.",
            "Os pedidos ainda sem pediatra atribuído ficam numa fila geral de triagem, com apenas a informação necessária à avaliação inicial — sem nome completo nem contacto.",
            "Depois do agendamento, o processo clínico completo fica acessível ao pediatra responsável pelo caso.",
            "Outros pediatras só acedem por motivo justificado — substituição, apoio clínico ou encaminhamento interno — e esse acesso fica registado para auditoria.",
            "A administração acede aos dados de gestão de utilizadores, actividade e relatórios, sem exposição do conteúdo clínico detalhado.",
          ],
        },
        {
          heading: "Canal USSD",
          paragraphs: [
            "No canal USSD o número de telemóvel é capturado pela rede e nunca é digitado pelo utilizador. É esse número que liga o pedido ao encarregado de educação e, através dele, à criança.",
            "Um pedido feito a partir de um número ainda não registado cria uma ficha provisória de encarregado, que a família pode assumir mais tarde ao criar conta na web com o mesmo número.",
          ],
        },
        {
          heading: "Conservação e eliminação",
          paragraphs: [
            "O registo clínico não é eliminado. Uma criança sem qualquer pedido pode ser removida da conta; havendo pedidos ou histórico, o registo é arquivado, preservando toda a informação clínica.",
            "As contas de utilizador com actividade no sistema são desactivadas, nunca apagadas. Um pediatra com teleconsultas registadas mantém sempre a identificação associada aos actos clínicos que praticou.",
          ],
        },
        {
          heading: "Demonstração pública",
          paragraphs: [
            "Os dados apresentados na página inicial e no simulador são fictícios e estão anonimizados: as crianças são identificadas por iniciais ou referência, os números de telemóvel aparecem parcialmente ocultos e a localização limita-se ao bairro e à cidade.",
          ],
        },
        {
          heading: "Emergências",
          paragraphs: [
            "A plataforma não substitui o atendimento presencial nem os serviços de emergência. Perante sintomas críticos, dirija-se imediatamente à unidade sanitária mais próxima ou ligue 1420.",
          ],
        },
        {
          heading: "Exercer os seus direitos",
          paragraphs: [
            "Para aceder, corrigir ou pedir esclarecimentos sobre a informação da sua família, contacte a administração do Hospital Geral de Mavalane através da página de contacto.",
          ],
        },
      ]}
    />
  );
}

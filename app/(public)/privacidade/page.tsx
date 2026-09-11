import type { Metadata } from "next";

import { DocumentPage } from "@/components/marketing/document-page";
import { EMERGENCY_NOTICE } from "@/lib/data/symptoms";

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
      updatedAt="Setembro de 2026"
      sections={[
        {
          heading: "Dados recolhidos",
          paragraphs: [
            "A plataforma recolhe apenas o que é necessário para triar e realizar a teleconsulta pediátrica.",
            "A teleconsulta só é realizada com o consentimento do encarregado de educação, registado no momento da submissão do pedido. A consulta não é gravada automaticamente.",
          ],
          bullets: [
            "Identificação do encarregado de educação: nome, número de telemóvel, documento de identificação e bairro de residência.",
            "Identificação da criança: nome, data de nascimento e sexo.",
            "Informação clínica: sintomas indicados, observações do encarregado, observações da triagem, notas clínicas, orientação, prescrição e anexos partilhados.",
            "Dados técnicos do pedido: modalidade escolhida, origem (USSD ou web), data e hora de submissão, de triagem, de atribuição e de agendamento.",
            "Registo das acções importantes sobre o pedido e das alterações do agendamento, incluindo o autor e o momento de cada uma.",
          ],
        },
        {
          heading: "Finalidade do tratamento",
          paragraphs: [
            "Os dados são tratados para que um profissional de saúde possa triar o pedido, para o atribuir a um pediatra, agendar e realizar a teleconsulta, registar a orientação clínica e a prescrição no histórico da criança e produzir indicadores institucionais do serviço.",
            "A plataforma não realiza triagem clínica nem atribui prioridades automaticamente: a classificação é sempre um acto de um profissional de triagem, registado com o seu nome e a respectiva justificação.",
            "Os indicadores institucionais são sempre agregados: não identificam crianças nem encarregados.",
          ],
        },
        {
          heading: "Quem acede à informação",
          bullets: [
            "O encarregado de educação acede aos pedidos, ao histórico, às orientações e às prescrições das crianças da sua conta — e apenas a essas.",
            "O profissional de triagem acede aos sintomas, às observações do encarregado e à idade da criança, o necessário para classificar o pedido. Não acede a notas clínicas nem a prescrições.",
            "O perfil administrativo acede aos dados de gestão — referência, idade, sintomas, prioridade, data e hora, triagem, pediatra atribuído, estado, modalidade e observações — sem conteúdo clínico detalhado. Não cria, altera nem elimina prescrições.",
            "O pediatra responsável pelo pedido acede ao processo clínico completo da criança que lhe foi atribuída.",
            "Outros pediatras só acedem por motivo justificado — substituição, apoio clínico ou encaminhamento interno — e esse acesso fica registado para auditoria.",
            "As notas clínicas e as prescrições estão restritas ao pediatra responsável e ao encarregado responsável pela respectiva criança.",
          ],
        },
        {
          heading: "Canal USSD",
          paragraphs: [
            "No canal USSD o número de telemóvel é capturado pela rede e nunca é digitado pelo utilizador. É esse número que liga o pedido ao encarregado de educação e, através dele, à criança.",
            "Um pedido feito a partir de um número ainda não registado cria uma conta provisória de encarregado. Essa conta não inicia sessão: tem de ser activada com credenciais definitivas, pela própria família ao criar conta na web com o mesmo número, ou pela administração do hospital. Em qualquer dos casos, os pedidos submetidos por USSD continuam associados ao mesmo encarregado.",
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
            "A página inicial não apresenta qualquer dado de crianças — nem nomes, nem idades, nem bairros, nem contactos. Dentro da plataforma, os perfis que não precisam de identificar a criança vêem apenas iniciais e a referência do pedido, com o número de telemóvel parcialmente oculto e a localização limitada ao bairro.",
            "O Simulador USSD é uma simulação integrada no protótipo académico. O código *123# é apenas demonstrativo e ainda não está disponível para utilização direta num telemóvel.",
          ],
        },
        {
          heading: "Emergências",
          paragraphs: [
            EMERGENCY_NOTICE,
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

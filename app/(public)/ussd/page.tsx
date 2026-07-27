import type { Metadata } from "next";

import { UssdView } from "./ussd-view";

export const metadata: Metadata = {
  title: "Simulador USSD",
  description:
    "Simulador do atendimento USSD *123# do HGM TelePediatria, para telemóveis sem internet.",
};

export default function UssdPage() {
  return <UssdView />;
}

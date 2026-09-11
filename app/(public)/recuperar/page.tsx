import type { Metadata } from "next";

import { RecoverView } from "./recover-view";

export const metadata: Metadata = {
  title: "Recuperar palavra-passe",
  description:
    "Recupere o acesso à sua conta HGM TelePediatria ou peça apoio à administração do hospital.",
};

export default function RecuperarPage() {
  return <RecoverView />;
}

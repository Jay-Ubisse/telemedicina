import type { Metadata } from "next";

import { RecoverView } from "./recover-view";

export const metadata: Metadata = {
  title: "Recuperar palavra-passe",
  description:
    "Recupere o acesso à sua conta HGM TelePediatria por SMS ou junto da administração do hospital.",
};

export default function RecuperarPage() {
  return <RecoverView />;
}

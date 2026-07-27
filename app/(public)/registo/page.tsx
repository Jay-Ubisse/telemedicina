import type { Metadata } from "next";

import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Registe-se como encarregado de educação e cadastre a sua criança para solicitar teleconsultas no HGM.",
};

export default function RegisterPage() {
  return <RegisterView />;
}

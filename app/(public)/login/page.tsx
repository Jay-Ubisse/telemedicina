import type { Metadata } from "next";

import { LoginView } from "./login-view";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Aceda ao painel HGM TelePediatria como encarregado de educação, pediatra ou administrador.",
};

export default function LoginPage() {
  return <LoginView />;
}

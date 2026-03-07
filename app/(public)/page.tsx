import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-2xl rounded-3xl border bg-background p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Telemedicina Demo</h1>
        <p className="mt-3 text-muted-foreground">
          Plataforma demo com dashboard médico e simulador USSD do paciente.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">Entrar no Dashboard</Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link href="/ussd">Abrir Simulador USSD</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

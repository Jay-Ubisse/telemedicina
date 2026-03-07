import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { doctorProfile } from "@/lib/data/doctor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PerfilPage() {
  return (
    <div>
      <AppHeader title="Perfil" subtitle="Informações do médico." />

      <PageShell>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Perfil do Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Nome:</span> {doctorProfile.name}
            </p>
            <p>
              <span className="font-medium">Especialidade:</span>{" "}
              {doctorProfile.specialty}
            </p>
            <p>
              <span className="font-medium">Email:</span> {doctorProfile.email}
            </p>
            <p>
              <span className="font-medium">Telefone:</span>{" "}
              {doctorProfile.phone}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    </div>
  );
}

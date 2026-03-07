import { Button } from "@/components/ui/button";

export function UssdMenu({
  onStart,
  onStatus,
}: {
  onStart: () => void;
  onStatus: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
        <p>*123#</p>
        <p className="mt-2 font-medium">Bem-vindo à Telemedicina Demo</p>
        <div className="mt-3 space-y-1 text-muted-foreground">
          <p>1. Solicitar teleconsulta</p>
          <p>2. Ver estado do pedido</p>
          <p>0. Cancelar</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Button onClick={onStart}>1. Solicitar teleconsulta</Button>
        <Button variant="outline" onClick={onStatus}>
          2. Ver estado do pedido
        </Button>
      </div>
    </div>
  );
}

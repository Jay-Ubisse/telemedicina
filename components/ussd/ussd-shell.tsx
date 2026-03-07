import type { ReactNode } from "react";
import { Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function UssdShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="overflow-hidden rounded-[2rem] border-2 shadow-xl">
        <div className="flex items-center justify-center border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="h-4 w-4" />
            Simulador USSD
          </div>
        </div>

        <CardContent className="bg-background p-0">
          <div className="min-h-[560px]">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}

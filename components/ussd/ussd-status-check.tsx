"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { UssdActions } from "./ussd-actions";
import { useTelemedicineStore } from "@/lib/store/telemedicine-store";
import { StatusBadge } from "@/components/telemedicine/status-badge";
import { PriorityBadge } from "@/components/telemedicine/priority-badge";

export function UssdStatusCheck({ onCancel }: { onCancel: () => void }) {
  const [phone, setPhone] = useState("");
  const teleconsultations = useTelemedicineStore(
    (state) => state.teleconsultations,
  );

  const latestMatch = useMemo(() => {
    const matches = teleconsultations
      .filter(
        (item) => item.phone.includes(phone.trim()) && phone.trim() !== "",
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return matches[0];
  }, [teleconsultations, phone]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Digite o número de telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {phone.trim() !== "" ? (
        latestMatch ? (
          <div className="rounded-2xl border p-4 text-sm">
            <p className="font-semibold">{latestMatch.patientName}</p>
            <p className="mt-1 text-muted-foreground">{latestMatch.phone}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={latestMatch.status} />
              <PriorityBadge priority={latestMatch.priority} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum pedido encontrado para este número.
          </div>
        )
      ) : null}

      <UssdActions onCancel={onCancel} />
    </div>
  );
}

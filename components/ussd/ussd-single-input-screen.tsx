import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UssdSingleInputScreenProps = {
  title: string;
  body: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  inputType?: string;
};

export function UssdSingleInputScreen({
  title,
  body,
  value,
  onChange,
  placeholder,
  onSubmit,
  onCancel,
  submitLabel = "Enviar",
  cancelLabel = "Cancelar",
  inputType = "text",
}: UssdSingleInputScreenProps) {
  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="border-b bg-black px-5 py-4 text-green-400">
        <p className="text-sm font-semibold">{title}</p>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm">{body}</div>

        <div className="mt-4">
          <Input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit();
              }
            }}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={onSubmit}>{submitLabel}</Button>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

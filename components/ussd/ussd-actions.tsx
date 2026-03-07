import { Button } from "@/components/ui/button";

type UssdActionsProps = {
  onBack?: () => void;
  onCancel?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  cancelLabel?: string;
  disableNext?: boolean;
};

export function UssdActions({
  onBack,
  onCancel,
  onNext,
  nextLabel = "Continuar",
  backLabel = "Voltar",
  cancelLabel = "Cancelar",
  disableNext = false,
}: UssdActionsProps) {
  return (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
      <div className="flex gap-2">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}

        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>

      {onNext ? (
        <Button type="button" onClick={onNext} disabled={disableNext}>
          {nextLabel}
        </Button>
      ) : null}
    </div>
  );
}

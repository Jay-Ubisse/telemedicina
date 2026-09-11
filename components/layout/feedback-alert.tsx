import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Feedback } from "@/lib/hooks/use-feedback";

/**
 * Apresentação das mensagens devolvidas por `useFeedback`. Fica num componente
 * próprio para que todos os ecrãs mostrem erros e confirmações da mesma forma —
 * e para que desapareçam todos da mesma forma (§12 do relatório).
 */
export function FeedbackAlert({
  feedback,
  className,
}: {
  feedback: Feedback;
  className?: string;
}) {
  if (!feedback) return null;

  return (
    <Alert
      variant={feedback.tone === "ok" ? "success" : "destructive"}
      className={className}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.tone === "ok" ? <CheckCircle2 /> : <AlertCircle />}
      {feedback.title ? <AlertTitle>{feedback.title}</AlertTitle> : null}
      <AlertDescription>{feedback.text}</AlertDescription>
    </Alert>
  );
}

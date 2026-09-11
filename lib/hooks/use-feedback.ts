"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FeedbackTone = "ok" | "error";

export type Feedback = { tone: FeedbackTone; text: string; title?: string } | null;

/**
 * Mensagens de erro e de confirmação que não ficam a pairar no ecrã.
 *
 * O relatório (§12) assinalou que as mensagens de erro permaneciam visíveis
 * mesmo depois de o utilizador corrigir os dados. Aqui a mensagem desaparece
 * sozinha depois de alguns segundos e, sobretudo, é descartada assim que o
 * utilizador mexe nos campos — basta chamar `clear()` no `onChange` do
 * formulário. Cada nova mensagem reinicia o temporizador.
 *
 * @param timeout milissegundos até a mensagem desaparecer (0 desliga).
 */
export function useFeedback(timeout = 7000) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef<number | null>(null);

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    cancelTimer();
    setFeedback((current) => (current === null ? current : null));
  }, [cancelTimer]);

  const show = useCallback(
    (next: NonNullable<Feedback>) => {
      cancelTimer();
      setFeedback(next);

      if (timeout > 0) {
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setFeedback(null);
        }, timeout);
      }
    },
    [cancelTimer, timeout],
  );

  const showError = useCallback(
    (text: string, title?: string) => show({ tone: "error", text, title }),
    [show],
  );

  const showOk = useCallback(
    (text: string, title?: string) => show({ tone: "ok", text, title }),
    [show],
  );

  /**
   * Atalho para o resultado de uma acção da store: mostra o erro devolvido ou a
   * confirmação de sucesso.
   */
  const report = useCallback(
    (result: { ok: boolean; error?: string }, success: string) => {
      if (result.ok) {
        if (success) showOk(success);
        else clear();
        return true;
      }
      showError(result.error ?? "Ocorreu um erro.");
      return false;
    },
    [clear, showError, showOk],
  );

  useEffect(() => cancelTimer, [cancelTimer]);

  return { feedback, showError, showOk, report, clear };
}

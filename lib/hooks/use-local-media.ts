"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Acesso à câmara e ao microfone do próprio dispositivo.
 *
 * A sala de teleconsulta continua a ser uma simulação — não há servidor de
 * sinalização nem par remoto —, mas a auto-visualização passa a mostrar a
 * imagem real da câmara, como numa chamada verdadeira. A captura só arranca
 * quando o utilizador entra na sala e é libertada assim que a chamada termina
 * ou o componente é desmontado.
 */
export type MediaStatus =
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "unavailable"
  | "busy"
  | "insecure"
  | "error";

export type LocalMedia = {
  stream: MediaStream | null;
  status: MediaStatus;
  /** Mensagem pronta a apresentar quando a captura não foi possível. */
  message: string | null;
  /** Nome do dispositivo devolvido pelo browser (ex.: "FaceTime HD Camera"). */
  cameraLabel: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
  start: (options: { video: boolean }) => Promise<boolean>;
  stop: () => void;
  setTrackEnabled: (kind: "audio" | "video", enabled: boolean) => void;
};

const messages: Record<Exclude<MediaStatus, "idle" | "requesting" | "live">, string> = {
  denied:
    "Autorização negada. A sala continua em modo de demonstração — para usar a câmara, permita o acesso nas definições do navegador e volte a entrar.",
  unavailable:
    "Não foi encontrada nenhuma câmara ou microfone neste dispositivo. A sala continua em modo de demonstração.",
  busy: "A câmara está a ser usada por outra aplicação. Feche-a e volte a entrar na sala.",
  insecure:
    "O navegador só permite abrir a câmara em ligações seguras (HTTPS) ou em localhost. A sala continua em modo de demonstração.",
  error:
    "Não foi possível aceder à câmara deste dispositivo. A sala continua em modo de demonstração.",
};

function classify(error: unknown): Exclude<MediaStatus, "idle" | "requesting" | "live"> {
  const name = error instanceof DOMException ? error.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "unavailable";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "error";
}

export function useLocalMedia(): LocalMedia {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<MediaStatus>("idle");

  // O `stop` no desmontar tem de ver sempre a captura mais recente, por isso a
  // referência acompanha o estado.
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
  }, []);

  const start = useCallback(
    async ({ video }: { video: boolean }) => {
      // `getUserMedia` só existe em contextos seguros (HTTPS ou localhost).
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("insecure");
        return false;
      }

      setStatus("requesting");

      try {
        const captured = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: video ? { facingMode: "user" } : false,
        });

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = captured;
        setStream(captured);
        setStatus("live");
        return true;
      } catch (error) {
        setStatus(classify(error));
        return false;
      }
    },
    [],
  );

  const setTrackEnabled = useCallback(
    (kind: "audio" | "video", enabled: boolean) => {
      const tracks =
        kind === "audio"
          ? streamRef.current?.getAudioTracks()
          : streamRef.current?.getVideoTracks();

      tracks?.forEach((track) => {
        track.enabled = enabled;
      });
    },
    [],
  );

  // Sair da página com a câmara aberta seria inaceitável numa plataforma
  // clínica: o desmontar liberta sempre o dispositivo.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    [],
  );

  const videoTrack = stream?.getVideoTracks()[0] ?? null;

  return {
    stream,
    status,
    message:
      status === "idle" || status === "requesting" || status === "live"
        ? null
        : messages[status],
    cameraLabel: videoTrack?.label || null,
    hasVideo: Boolean(videoTrack),
    hasAudio: Boolean(stream?.getAudioTracks().length),
    start,
    stop,
    setTrackEnabled,
  };
}

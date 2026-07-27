"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Video,
  VideoOff,
} from "lucide-react";

import { initialsOf } from "@/components/layout/nav-items";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinicStore } from "@/lib/store/clinic-store";
import type { Consultation } from "@/lib/types/consultation";
import type { User } from "@/lib/types/user";
import { isMeetingLinkValid } from "@/lib/utils/consultations";
import { formatTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type Props = {
  consultation: Consultation;
  viewer: User;
  onEnded?: () => void;
};

/**
 * Sala de teleconsulta simulada.
 *
 * Correcções face ao protótipo testado:
 * - mostra sempre o pediatra atribuído a ESTE pedido, e não um nome fixo;
 * - o vídeo não arranca sozinho — é preciso entrar na sala explicitamente;
 * - "Encerrar" termina mesmo a chamada e devolve o controlo ao ecrã anterior.
 */
export function ConsultationRoom({ consultation, viewer, onEnded }: Props) {
  const sendMessage = useClinicStore((state) => state.sendMessage);

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(consultation.channel === "VIDEO");
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!joined) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [joined]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [consultation.messages.length]);

  const isDoctor = viewer.role === "PEDIATRA" || viewer.role === "ADMIN";
  const doctorName = consultation.assignedDoctorName ?? "Pediatra por atribuir";
  const remoteName = isDoctor ? consultation.guardianName : doctorName;
  const linkValid = isMeetingLinkValid(consultation);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = sendMessage(consultation.id, {
      authorName: viewer.name,
      authorRole: viewer.role,
      text: draft,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDraft("");
  }

  function handleEnd() {
    setJoined(false);
    setElapsed(0);
    onEnded?.();
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* Palco */}
      <div className="overflow-hidden rounded-2xl bg-[oklch(20%_0.02_245)] ring-1 ring-foreground/10">
        <div className="relative aspect-video">
          {!joined ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white">
                {initialsOf(remoteName)}
              </span>
              <div>
                <p className="font-semibold text-white">{remoteName}</p>
                <p className="mt-1 text-sm text-white/60">
                  {consultation.channel === "VIDEO"
                    ? "Videochamada pronta a iniciar"
                    : "Chamada de voz pronta a iniciar"}
                </p>
              </div>

              <Button
                size="xl"
                className="mt-1"
                onClick={() => setJoined(true)}
                disabled={consultation.status === "CONCLUIDA"}
              >
                <Video data-icon="inline-start" />
                Entrar na sala
              </Button>

              <p className="max-w-xs text-xs leading-relaxed text-white/45">
                A ligação só é estabelecida depois de confirmar — nada arranca
                automaticamente.
              </p>
            </div>
          ) : (
            <>
              {/* Vídeo remoto simulado */}
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,oklch(35%_0.05_245),oklch(18%_0.02_245))]">
                <div className="flex flex-col items-center gap-3">
                  <span className="flex size-20 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white ring-2 ring-white/15">
                    {initialsOf(remoteName)}
                  </span>
                  <p className="text-sm font-medium text-white/90">{remoteName}</p>
                </div>
              </div>

              {/* Auto-visualização */}
              <div className="absolute right-4 bottom-4 flex size-24 items-center justify-center overflow-hidden rounded-xl bg-[oklch(28%_0.03_245)] ring-1 ring-white/15 sm:size-32">
                {cameraOn ? (
                  <span className="text-sm font-bold text-white/80">
                    {initialsOf(viewer.name)}
                  </span>
                ) : (
                  <VideoOff className="size-5 text-white/50" />
                )}
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur">
                <span className="size-2 animate-pulse rounded-full bg-destructive" />
                <span className="font-mono text-xs font-semibold text-white tabular-nums">
                  {minutes}:{seconds}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controlos */}
        <div className="flex items-center justify-center gap-2.5 border-t border-white/10 px-4 py-4">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={micOn ? "Desligar microfone" : "Ligar microfone"}
            onClick={() => setMicOn((value) => !value)}
            disabled={!joined}
            className={cn(
              "rounded-full text-white hover:bg-white/10 hover:text-white",
              !micOn && "bg-destructive/25 text-destructive-foreground",
            )}
          >
            {micOn ? <Mic /> : <MicOff />}
          </Button>

          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={cameraOn ? "Desligar câmara" : "Ligar câmara"}
            onClick={() => setCameraOn((value) => !value)}
            disabled={!joined || consultation.channel !== "VIDEO"}
            className={cn(
              "rounded-full text-white hover:bg-white/10 hover:text-white",
              !cameraOn && "bg-destructive/25 text-destructive-foreground",
            )}
          >
            {cameraOn ? <Video /> : <VideoOff />}
          </Button>

          <Button
            size="lg"
            aria-label="Encerrar chamada"
            onClick={handleEnd}
            disabled={!joined}
            className="rounded-full bg-destructive px-5 text-white hover:bg-destructive/85"
          >
            <PhoneOff data-icon="inline-start" />
            Encerrar
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex max-h-[32rem] flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
        <div className="border-b border-border px-4 py-3.5">
          <h3 className="text-sm font-bold tracking-tight">Chat da consulta</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isDoctor
              ? `Com ${consultation.guardianName}`
              : `Com ${doctorName}`}
          </p>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {consultation.messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há mensagens nesta consulta.
            </p>
          ) : (
            consultation.messages.map((message) => {
              const mine = message.authorName === viewer.name;

              return (
                <div
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {!mine ? (
                      <p className="text-[0.6875rem] font-semibold opacity-70">
                        {message.authorName}
                      </p>
                    ) : null}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-[0.625rem] tabular-nums",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-3">
          {error ? (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {consultation.channel === "VIDEO" && !linkValid ? (
            <Alert variant="warning" className="mb-2">
              <Link2 />
              <AlertDescription>
                O link da videochamada não está activo. O pediatra pode reenviá-lo
                por SMS.
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva uma mensagem…"
              aria-label="Mensagem"
              className="h-10 flex-1 rounded-xl"
            />
            <Button
              type="submit"
              size="icon-lg"
              className="rounded-xl"
              aria-label="Enviar mensagem"
              disabled={draft.trim() === ""}
            >
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

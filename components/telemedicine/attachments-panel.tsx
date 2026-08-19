"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Upload,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/layout/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttachmentInput, ActionResult } from "@/lib/store/clinic-store";
import type { Attachment, AttachmentKind } from "@/lib/types/consultation";
import { formatDateTime } from "@/lib/utils/date";

/** 4 MB: os anexos vivem em localStorage nesta pré-visualização. */
const MAX_BYTES = 4 * 1024 * 1024;

const kindLabels: Record<AttachmentKind, string> = {
  IMAGEM: "Imagem",
  EXAME: "Exame",
  DOCUMENTO: "Documento",
};

/** Tipo sugerido a partir do ficheiro escolhido — ainda editável. */
function guessKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "IMAGEM";
  if (file.type === "application/pdf") return "EXAME";
  return "DOCUMENTO";
}

function formatBytes(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Anexos do pedido.
 *
 * O protótipo testado tinha um campo de texto onde se escrevia o nome do
 * ficheiro — que era sempre classificado como "EXAME" — e um botão
 * "Visualizar" sem qualquer efeito. Aqui escolhe-se um ficheiro real, o tipo é
 * proposto a partir do conteúdo e a pré-visualização abre imagens e PDFs.
 */
export function AttachmentsPanel({
  attachments,
  onAdd,
  readOnly = false,
}: {
  attachments: Attachment[];
  onAdd: (attachment: AttachmentInput) => ActionResult<unknown>;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<AttachmentKind>("EXAME");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);

  function pick(selected: File | null) {
    setError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > MAX_BYTES) {
      setError(
        `O ficheiro tem ${formatBytes(selected.size)}. O limite desta pré-visualização é 4 MB.`,
      );
      setFile(null);
      return;
    }

    setFile(selected);
    setKind(guessKind(selected));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Escolha um ficheiro para anexar.");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const result = onAdd({
        name: file.name,
        kind,
        mimeType: file.type || undefined,
        size: file.size,
        dataUrl,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Não foi possível ler o ficheiro. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold tracking-tight">
            Exames e imagens partilhadas
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ficheiros carregados nesta sessão ficam guardados no pedido e podem
            ser visualizados aqui.
          </p>
        </div>

        {attachments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Paperclip className="size-5" />}
              title="Sem anexos"
              description="Fotografias, exames e relatórios partilhados aparecem aqui."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    {attachment.kind === "IMAGEM" ? (
                      <ImageIcon className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kindLabels[attachment.kind]} ·{" "}
                      {formatDateTime(attachment.addedAt)}
                      {attachment.size ? ` · ${formatBytes(attachment.size)}` : ""}
                      {attachment.dataUrl ? "" : " · demonstração"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview(attachment)}
                >
                  <Eye data-icon="inline-start" />
                  Visualizar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {readOnly ? (
        <Alert variant="info">
          <AlertCircle />
          <AlertDescription>
            A teleconsulta está encerrada — os anexos já não podem ser
            alterados.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8"
        >
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Label htmlFor="attachment-file" className="text-sm font-semibold">
            Adicionar anexo
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Imagens, PDF ou documentos até 4 MB.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <div>
              <input
                ref={inputRef}
                id="attachment-file"
                name="attachment-file"
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={(event) => pick(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-l-xl file:border-0 file:bg-muted file:px-3.5 file:py-2.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-muted/70"
              />

              {file ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {file.name} · {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      pick(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remover ficheiro escolhido"
                  >
                    <X className="size-3.5" />
                  </button>
                </p>
              ) : null}
            </div>

            <div>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as AttachmentKind)}
              >
                <SelectTrigger
                  aria-label="Tipo de anexo"
                  className="h-11 w-full rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGEM">{kindLabels.IMAGEM}</SelectItem>
                  <SelectItem value="EXAME">{kindLabels.EXAME}</SelectItem>
                  <SelectItem value="DOCUMENTO">{kindLabels.DOCUMENTO}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-4"
            disabled={!file || busy}
          >
            <Upload data-icon="inline-start" />
            {busy ? "A anexar…" : "Anexar ficheiro"}
          </Button>
        </form>
      )}

      <AttachmentPreview
        attachment={preview}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

/** Pré-visualização: imagem ou PDF através de um `blob:` temporário. */
function AttachmentPreview({
  attachment,
  onClose,
}: {
  attachment: Attachment | null;
  onClose: () => void;
}) {
  // O `blob:` é derivado do anexo (e não guardado em estado) para o efeito
  // ficar só com o que tem mesmo de fazer: libertar o URL no fim.
  const objectUrl = useMemo(
    () =>
      attachment?.dataUrl
        ? URL.createObjectURL(dataUrlToBlob(attachment.dataUrl))
        : null,
    [attachment],
  );

  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const isImage =
    attachment?.mimeType?.startsWith("image/") ?? attachment?.kind === "IMAGEM";
  const isPdf = attachment?.mimeType === "application/pdf";

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-all">{attachment?.name}</DialogTitle>
          <DialogDescription>
            {attachment
              ? `${kindLabels[attachment.kind]} · adicionado em ${formatDateTime(
                  attachment.addedAt,
                )}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {!attachment?.dataUrl ? (
          <Alert variant="info">
            <AlertCircle />
            <AlertDescription>
              Este é um anexo de demonstração: existe no registo do pedido, mas
              não tem ficheiro associado. Carregue um ficheiro real para o
              visualizar aqui.
            </AlertDescription>
          </Alert>
        ) : isImage && objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={attachment.name}
            className="max-h-[60vh] w-full rounded-xl bg-muted object-contain"
          />
        ) : isPdf && objectUrl ? (
          <iframe
            src={objectUrl}
            title={attachment.name}
            className="h-[60vh] w-full rounded-xl border border-border"
          />
        ) : (
          <Alert variant="info">
            <AlertCircle />
            <AlertDescription>
              Este tipo de ficheiro não tem pré-visualização. Descarregue-o para
              o abrir.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {objectUrl ? (
            <Button asChild variant="outline" size="lg">
              <a href={objectUrl} download={attachment?.name}>
                <Download data-icon="inline-start" />
                Descarregar
              </a>
            </Button>
          ) : null}
          <Button size="lg" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

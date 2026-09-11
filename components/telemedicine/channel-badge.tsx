import { MessageSquare, Phone, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { channelLabels } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

/** Modalidade de atendimento: texto, áudio ou vídeo (§8 do relatório). */
const icons: Record<ConsultationChannel, typeof Video> = {
  VIDEO: Video,
  AUDIO: Phone,
  TEXTO: MessageSquare,
};

export function ChannelBadge({
  channel,
  className,
}: {
  channel: ConsultationChannel;
  className?: string;
}) {
  const Icon = icons[channel];

  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-6 gap-1.5 px-2 text-xs font-medium text-muted-foreground ring-1 ring-border",
        className,
      )}
    >
      <Icon aria-hidden />
      {channelLabels[channel]}
    </Badge>
  );
}

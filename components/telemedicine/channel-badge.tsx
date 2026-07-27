import { Phone, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConsultationChannel } from "@/lib/types/consultation";
import { channelLabels } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

export function ChannelBadge({
  channel,
  className,
}: {
  channel: ConsultationChannel;
  className?: string;
}) {
  const Icon = channel === "VIDEO" ? Video : Phone;

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

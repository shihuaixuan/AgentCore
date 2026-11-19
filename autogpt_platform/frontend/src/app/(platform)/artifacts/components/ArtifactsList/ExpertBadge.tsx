"use client";

import { useExpertMap } from "@/app/(platform)/copilot/useExpertMap";
import { Badge } from "@/components/atoms/Badge/Badge";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

interface Props {
  expertId: string | null | undefined;
  className?: string;
}

export function ExpertBadge({ expertId, className }: Props) {
  const { t, locale } = useTranslation();
  const { expertsById } = useExpertMap();
  const expert = expertId ? expertsById.get(expertId) : undefined;
  if (!expert) return null;
  const title = getExpertDisplayTitle(expert, locale);

  return (
    <span
      className={cn("inline-flex items-center", className)}
      title={t(`From ${title}`, `来自 ${title}`)}
      data-testid="artifacts-expert-badge"
    >
      {/* oxlint-disable-next-line design-system/no-restyle -- the avatar sits nearer the edge than a label; Badge has no leading-avatar size */}
      <Badge variant="info" size="small" className="pl-1">
        <span aria-hidden className="flex shrink-0">
          <ExpertAvatar name={title} avatarUrl={expert.avatarUrl} size={14} />
        </span>
        {title}
      </Badge>
    </span>
  );
}

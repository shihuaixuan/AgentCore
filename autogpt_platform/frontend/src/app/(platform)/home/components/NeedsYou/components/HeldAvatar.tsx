import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

interface Props {
  item: HomeAttentionItem;
  size: number;
}

export function HeldAvatar({ item, size }: Props) {
  const { locale } = useTranslation();
  return item.expert ? (
    <ExpertAvatar
      name={getExpertDisplayTitle(item.expert, locale)}
      avatarUrl={item.expert.avatar_url}
      size={size}
    />
  ) : (
    <AutopilotAvatar size={size} />
  );
}

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import type { ExpertIdentity } from "../../../useExpertMap";
import { ExpertAvatar } from "../../ChatMessagesContainer/components/ExpertAvatar/ExpertAvatar";

interface Props {
  expert: ExpertIdentity;
}

export function FixedRecipientLabel({ expert }: Props) {
  const { locale } = useTranslation();
  const name = getExpertDisplayTitle(expert, locale);
  return (
    <span className="inline-flex h-9 max-w-44 min-w-0 items-center gap-1.5 rounded-full border border-border-base bg-surface px-2">
      <span aria-hidden="true" className="flex shrink-0">
        <ExpertAvatar
          name={name}
          avatarUrl={expert.avatarUrl}
          color={expert.color}
          size="sm"
        />
      </span>
      <Text as="span" variant="body-tight" className="truncate" title={name}>
        {name}
      </Text>
    </span>
  );
}

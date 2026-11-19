import { Text } from "@/components/atoms/Text/Text";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import type { TaskOwner } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const AVATAR_SIZE = 28;

export function OwnerAvatar({ owner }: { owner: TaskOwner }) {
  const { locale } = useTranslation();
  if (owner.kind === "otto")
    return <AutopilotAvatar size={AVATAR_SIZE} className="shrink-0" />;
  return (
    <ExpertAvatar
      name={getExpertDisplayTitle(owner.expert, locale)}
      avatarUrl={owner.expert.avatarUrl}
      backgroundColor={owner.expert.color ?? undefined}
      size={AVATAR_SIZE}
      className="shrink-0"
    />
  );
}

export function OwnerLabel({ owner }: { owner: TaskOwner }) {
  const { locale } = useTranslation();
  if (owner.kind === "otto")
    return (
      // Text has no accent tone, so the role classes go on the span.
      <span className="font-sans text-caption font-medium text-accent-strong sm:whitespace-nowrap">
        Otto
      </span>
    );
  return (
    <Text
      variant="small-medium"
      as="span"
      tone="primary"
      className="sm:whitespace-nowrap"
    >
      {getExpertDisplayTitle(owner.expert, locale)}
    </Text>
  );
}

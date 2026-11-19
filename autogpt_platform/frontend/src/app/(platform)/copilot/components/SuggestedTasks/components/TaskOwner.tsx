import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { DEFAULT_ASSISTANT_AVATAR_URL } from "@/services/experts/default-assistant";
import { getOwnerName, type TaskOwner } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const AVATAR_SIZE = 28;

export function OwnerAvatar({ owner }: { owner: TaskOwner }) {
  const { locale } = useTranslation();
  return (
    <ExpertAvatar
      name={getOwnerName(owner, locale)}
      avatarUrl={
        owner.kind === "expert"
          ? owner.expert.avatarUrl
          : DEFAULT_ASSISTANT_AVATAR_URL
      }
      backgroundColor={
        owner.kind === "expert" ? (owner.expert.color ?? undefined) : undefined
      }
      size={AVATAR_SIZE}
      className="shrink-0"
    />
  );
}

export function OwnerLabel({ owner }: { owner: TaskOwner }) {
  const { locale } = useTranslation();
  return (
    <Text
      variant="small-medium"
      as="span"
      tone="primary"
      className="sm:whitespace-nowrap"
    >
      {getOwnerName(owner, locale)}
    </Text>
  );
}

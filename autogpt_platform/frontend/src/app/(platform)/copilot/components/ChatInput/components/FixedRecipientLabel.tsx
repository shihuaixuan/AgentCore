import { Text } from "@/components/atoms/Text/Text";
import type { ExpertIdentity } from "../../../useExpertMap";
import { ExpertAvatar } from "../../ChatMessagesContainer/components/ExpertAvatar/ExpertAvatar";

interface Props {
  expert: ExpertIdentity;
  name: string;
}

export function FixedRecipientLabel({ expert, name }: Props) {
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

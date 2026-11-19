import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "./ExpertAvatar/ExpertAvatar";

interface Props {
  name: string;
  avatarUrl: string | null;
  color?: string | null;
  isLoading: boolean;
}

export function ReplyAuthor({ name, avatarUrl, color, isLoading }: Props) {
  return (
    <div
      data-testid="expert-assistant-identity"
      className="flex min-w-0 items-center gap-2"
    >
      <span aria-hidden="true" className="flex shrink-0">
        <ExpertAvatar
          name={name}
          avatarUrl={avatarUrl}
          color={color}
          isLoading={isLoading}
          size="sm"
        />
      </span>
      {isLoading ? (
        <Skeleton className="h-3.5 w-16 rounded" />
      ) : (
        <Text
          variant="small-tight"
          as="span"
          weight="semibold"
          className="truncate"
        >
          {name}
        </Text>
      )}
    </div>
  );
}

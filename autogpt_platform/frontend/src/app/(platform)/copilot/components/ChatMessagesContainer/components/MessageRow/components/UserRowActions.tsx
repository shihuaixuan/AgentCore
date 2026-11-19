import { MessageActions } from "@/components/organisms/Message/Message";
import { CopyButton } from "../../CopyButton";
import { QueueBadge } from "../../QueueBadge";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  showQueueBadge: boolean;
  showCopy: boolean;
  createdAt?: string;
  copyText: string;
  sessionID?: string | null;
}

export function UserRowActions({
  showQueueBadge,
  showCopy,
  createdAt,
  copyText,
  sessionID,
}: Props) {
  const { locale } = useTranslation();
  const date = createdAt ? new Date(createdAt) : null;
  return (
    <>
      {showQueueBadge && (
        <MessageActions
          className="mt-1 items-center justify-end gap-1.5"
          data-testid="queue-status-row"
        >
          <QueueBadge sessionID={sessionID ?? null} />
        </MessageActions>
      )}
      {showCopy && (
        <MessageActions className="mt-1 items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          {date && !Number.isNaN(date.getTime()) && (
            <span className="text-caption-sm leading-inherit text-foreground-tertiary tabular-nums [@media(hover:none)]:hidden">
              {date.toLocaleString(locale === "zh-CN" ? locale : undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
          <CopyButton text={copyText} />
        </MessageActions>
      )}
    </>
  );
}

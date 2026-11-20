import { Button } from "@/components/atoms/Button/Button";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId, type ReactNode } from "react";
import type { ImportConversation } from "../validation";
import { Transcript } from "./Transcript";

type RowProps = {
  checked: boolean;
  expanded: boolean;
  disabled: boolean;
  onSelect: (checked: boolean) => void;
  onPreview: () => void;
  omittedUnattributed?: boolean;
  children?: ReactNode;
};

export function ImportConversationRow({
  entry,
  children,
  ...controls
}: RowProps & { entry: ImportConversation }) {
  return (
    <ConversationReviewRow
      {...controls}
      title={entry.title}
      messageCount={entry.messages.length}
    >
      <Transcript messages={entry.messages} />
      {children}
    </ConversationReviewRow>
  );
}

export function ConversationReviewRow({
  title,
  messageCount,
  omittedUnattributed,
  checked,
  expanded,
  disabled,
  onSelect,
  onPreview,
  children,
}: RowProps & { title: string; messageCount: number }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <li className="space-y-2 border-b border-border-base py-2 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <Checkbox
          aria-labelledby={`${id}-select ${id}-title`}
          checked={checked}
          onCheckedChange={(value) => onSelect(value === true)}
          disabled={disabled}
        />
        <Text as="span" id={`${id}-select`} variant="small" className="sr-only">
          {t("Select", "选择")}
        </Text>
        <div className="min-w-0 flex-1">
          <Text
            id={`${id}-title`}
            variant="body-medium"
            className="break-words"
            dir="auto"
          >
            {title}
          </Text>
          <Text variant="small" tone="secondary">
            {t(`Messages: ${messageCount}`, `${messageCount} 条消息`)}
          </Text>
          {omittedUnattributed && (
            <Text variant="small" tone="secondary">
              {t(
                "Messages with unclear authorship were left out.",
                "已略过无法确认归属的消息。",
              )}
            </Text>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={onPreview}
        >
          {expanded ? t("Hide preview", "收起预览") : t("Preview", "预览")}
        </Button>
      </div>
      <div id={id} hidden={!expanded} className="space-y-3">
        {expanded && children}
      </div>
    </li>
  );
}

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { newRecipientChatHref } from "../../../expertSessionQuery";
import { ExpertAvatar } from "../../ChatMessagesContainer/components/ExpertAvatar/ExpertAvatar";
import {
  OTTO_RECIPIENT_OPTION,
  type RecipientOption,
  type RecipientPickerConfig,
} from "./recipientOptions";

interface Props extends RecipientPickerConfig {
  selectionBlocked?: string;
  onClose: () => void;
}

export function ExpertPickerOptions({
  recipient,
  options,
  isThreadPicker,
  isRosterPending,
  hasRosterFailed,
  selectionBlocked,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [nextID, setNextID] = useState<string | null>();
  const next =
    nextID === null ? null : options.find((option) => option.id === nextID);
  const search = query.trim().toLowerCase();
  const matchesOtto = isThreadPicker && "otto".includes(search);
  const matching = options.filter((option) =>
    [option.name, option.role].some((text) =>
      text?.toLowerCase().includes(search),
    ),
  );

  function select(id: string | null) {
    if (id === (recipient?.id ?? null)) onClose();
    else if (onSelect) {
      onSelect(id);
      onClose();
    } else setNextID(id);
  }

  if (next !== undefined) {
    return <NewTaskConfirmation next={next} onCancel={onClose} />;
  }

  return (
    <>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("Search experts", "搜索专家")}
        size="small"
      />
      {selectionBlocked && (
        <Text variant="small" tone="secondary" className="mx-2 mt-2">
          {selectionBlocked}
        </Text>
      )}
      <div className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
        {matchesOtto && (
          <ExpertOption
            option={OTTO_RECIPIENT_OPTION}
            selected={!recipient}
            disabled={!!selectionBlocked && !!recipient}
            onSelect={() => select(null)}
          />
        )}
        {matching.map((option) => (
          <ExpertOption
            key={option.id}
            option={option}
            selected={option.id === recipient?.id}
            disabled={!!selectionBlocked && option.id !== recipient?.id}
            onSelect={() => select(option.id)}
          />
        ))}
        {!matching.length &&
          (!matchesOtto || isRosterPending || hasRosterFailed) && (
            <Text variant="small" tone="secondary" className="m-2">
              {isRosterPending
                ? t("Loading experts…", "正在加载专家…")
                : hasRosterFailed
                  ? t("Could not load experts", "无法加载专家")
                  : t("No matching experts", "没有匹配的专家")}
            </Text>
          )}
      </div>
      <div className="mt-1 border-t border-border-base pt-1">
        {recipient && !isThreadPicker && (
          <Button
            type="button"
            variant="ghost"
            size="row"
            className="w-full justify-start"
            disabled={!!selectionBlocked}
            onClick={() => select(null)}
          >
            {onSelect
              ? t("Clear expert selection", "取消选择专家")
              : t("New task without an expert", "新建普通任务")}
          </Button>
        )}
        <Button
          as="NextLink"
          href="/marketplace#experts"
          variant="ghost"
          size="row"
          className="w-full justify-start"
        >
          {t("Browse more experts", "发现更多专家")}
        </Button>
      </div>
    </>
  );
}

function ExpertOption({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: RecipientOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      size="row"
      variant="ghost"
      aria-pressed={selected}
      disabled={disabled}
      className="w-full justify-start"
      onClick={onSelect}
    >
      <RecipientAvatar option={option} />
      <Text
        as="span"
        variant="body-tight"
        className="min-w-0 flex-1 truncate text-left"
      >
        {option.name}
        {option.role && ` · ${option.role}`}
      </Text>
      {selected && (
        <Icon aria-hidden icon={Tick02Icon} className="size-4 shrink-0" />
      )}
    </Button>
  );
}

function NewTaskConfirmation({
  next,
  onCancel,
}: {
  next: RecipientOption | null;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 p-2">
      <Text variant="body-medium">
        {next
          ? t(
              `Start a new chat with ${next.name}?`,
              `与 ${next.name} 开始新对话？`,
            )
          : t("Start a new task without an expert?", "新建普通任务？")}
      </Text>
      <Text variant="body" tone="secondary">
        {t(
          "Your current chat stays in history. Its messages and attachments won’t be copied.",
          "当前对话仍保存在历史中，消息和附件不会带入新对话。",
        )}
      </Text>
      <div className="flex justify-end gap-2">
        <Button
          autoFocus
          type="button"
          variant="secondary"
          size="row"
          onClick={onCancel}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button
          as="NextLink"
          href={newRecipientChatHref(next?.id ?? null)}
          size="row"
        >
          {next
            ? t("Start new chat", "开始新对话")
            : t("Start new task", "新建任务")}
        </Button>
      </div>
    </div>
  );
}

export function RecipientAvatar({ option }: { option: RecipientOption }) {
  return (
    <ExpertAvatar
      name={option.name}
      avatarUrl={option.avatarUrl}
      color={option.color}
      isAutopilot={option === OTTO_RECIPIENT_OPTION}
      size="sm"
    />
  );
}

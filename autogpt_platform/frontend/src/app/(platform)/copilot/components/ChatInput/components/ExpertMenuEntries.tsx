import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { RecipientAvatar, RecipientTitle } from "./ExpertPickerOptions";
import {
  OTTO_RECIPIENT_OPTION,
  recipientChoices,
  type RecipientPickerConfig,
} from "./recipientOptions";

type Props = Pick<
  RecipientPickerConfig,
  | "recipient"
  | "options"
  | "isRosterPending"
  | "hasRosterFailed"
  | "isThreadPicker"
> & {
  selectionBlocked?: string;
  onSelect: (id: string | null) => void;
};

export function ExpertMenuEntries({
  recipient,
  options,
  isRosterPending,
  hasRosterFailed,
  isThreadPicker,
  selectionBlocked,
  onSelect,
}: Props) {
  const { t, locale } = useTranslation();

  if (!options.length && !isThreadPicker) {
    const message = isRosterPending
      ? t("Loading experts…", "正在加载专家…")
      : hasRosterFailed
        ? t("Could not load experts", "无法加载专家")
        : t("No experts on your team yet", "团队里还没有专家");

    return (
      <>
        <Text as="p" variant="small" tone="secondary" className="mx-2 my-1.5">
          {message}
        </Text>
        {!isRosterPending && !hasRosterFailed && (
          <DropdownMenuItem asChild>
            <Link href="/marketplace#experts">
              {t("Browse more experts", "发现更多专家")}
            </Link>
          </DropdownMenuItem>
        )}
      </>
    );
  }

  return (
    <>
      {selectionBlocked && (
        <Text as="p" variant="small" tone="secondary" className="mx-2 my-1.5">
          {selectionBlocked}
        </Text>
      )}
      {recipientChoices(
        isThreadPicker ? [OTTO_RECIPIENT_OPTION, ...options] : options,
        locale,
      ).map(({ option, title, label }) => {
        const id = option === OTTO_RECIPIENT_OPTION ? null : option.id;
        const selected = id === (recipient?.id ?? null);
        return (
          <DropdownMenuItem
            key={option.id}
            aria-label={label}
            textValue={label}
            disabled={!!selectionBlocked && !selected}
            onSelect={() => {
              if (!selected) onSelect(id);
            }}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <RecipientAvatar option={option} title={title} />
              <RecipientTitle title={label} />
            </span>
            {selected && (
              <Icon
                icon={Tick02Icon}
                className="ml-1 size-4 shrink-0"
                aria-hidden
              />
            )}
          </DropdownMenuItem>
        );
      })}
      {recipient && !isThreadPicker && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!!selectionBlocked}
            onSelect={() => onSelect(null)}
          >
            {t("Clear expert selection", "取消选择专家")}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

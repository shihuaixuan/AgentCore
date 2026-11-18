import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { RecipientAvatar } from "./ExpertPickerOptions";
import type { RecipientPickerConfig } from "./recipientOptions";

type Props = Pick<
  RecipientPickerConfig,
  "recipient" | "options" | "isRosterPending" | "hasRosterFailed"
> & {
  selectionBlocked?: string;
  onSelect: (id: string | null) => void;
};

export function ExpertMenuEntries({
  recipient,
  options,
  isRosterPending,
  hasRosterFailed,
  selectionBlocked,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  if (!options.length) {
    const message = isRosterPending
      ? t("Loading experts…", "正在加载专家…")
      : hasRosterFailed
        ? t("Could not load experts", "无法加载专家")
        : t("No experts on your team yet", "团队里还没有专家");

    return (
      <>
        <Text as="p" variant="small" tone="secondary" className="px-2 py-1.5">
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
        <Text as="p" variant="small" tone="secondary" className="px-2 py-1.5">
          {selectionBlocked}
        </Text>
      )}
      {options.map((option) => {
        const selected = option.id === recipient?.id;
        return (
          <DropdownMenuItem
            key={option.id}
            textValue={option.name}
            disabled={!!selectionBlocked && !selected}
            className="gap-2"
            onSelect={() => {
              if (!selected) onSelect(option.id);
            }}
          >
            <RecipientAvatar option={option} />
            <span className="min-w-0 flex-1">
              <Text as="span" variant="body-tight" className="block truncate">
                {option.name}
              </Text>
              {option.role && (
                <Text
                  as="span"
                  variant="small"
                  tone="secondary"
                  className="block truncate"
                >
                  {option.role}
                </Text>
              )}
            </span>
            {selected && (
              <Icon icon={Tick02Icon} className="size-4 shrink-0" aria-hidden />
            )}
          </DropdownMenuItem>
        );
      })}
      {recipient && (
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

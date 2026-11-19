"use client";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/molecules/Popover/Popover";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { isKey } from "@/lib/keyboard";
import { cn } from "@/lib/utils";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useRef, useState, type RefObject } from "react";
import { useExpertMap, type ExpertIdentity } from "../../../useExpertMap";
import { ExpertPickerOptions, RecipientAvatar } from "./ExpertPickerOptions";
import {
  expertRecipient,
  OTTO_RECIPIENT_OPTION,
  recipientOptions,
  type RecipientPickerConfig,
} from "./recipientOptions";

interface Props extends RecipientPickerConfig {
  anchorRef?: RefObject<HTMLButtonElement | null>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  selectionBlocked?: string;
}

export function ThreadRecipientChip({
  expert,
  ...props
}: Pick<Props, "anchorRef" | "open" | "onOpenChange" | "disabled"> & {
  expert: ExpertIdentity | null;
}) {
  const { activeExperts } = useExpertMap();
  return (
    <RecipientChip
      {...props}
      recipient={expert ? expertRecipient(expert) : null}
      options={recipientOptions(activeExperts)}
    />
  );
}

const CHIP_CLASSNAME =
  "group inline-flex h-9 min-w-0 max-w-44 items-center gap-1.5 rounded-full border border-border-base bg-surface px-2 text-foreground-body";

export function RecipientChip({
  recipient,
  options,
  onSelect,
  isThreadPicker,
  isRosterPending,
  hasRosterFailed,
  isLoading,
  anchorRef,
  open,
  onOpenChange,
  disabled,
  selectionBlocked,
}: Props) {
  const { t } = useTranslation();
  const [localOpen, setLocalOpen] = useState(false);
  const setOpen = onOpenChange ?? setLocalOpen;
  const interactedOutside = useRef(false);
  const chip = recipient ?? (isThreadPicker ? OTTO_RECIPIENT_OPTION : null);
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={t("Loading recipient", "正在加载专家")}
        className={CHIP_CLASSNAME}
      >
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <Popover open={!disabled && (open ?? localOpen)} onOpenChange={setOpen}>
      {chip ? (
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={t(
              `Sending to ${chip.name} — change recipient`,
              `发送给 ${chip.name}，更换接收者`,
            )}
            className={cn(
              CHIP_CLASSNAME,
              "transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-60",
            )}
          >
            <RecipientAvatar option={chip} />
            <Text as="span" variant="body-tight" className="truncate">
              {chip.name}
            </Text>
            <Icon
              icon={ArrowDown01Icon}
              tone="secondary"
              motion="transform"
              className="size-3.5 shrink-0 group-data-[state=open]:rotate-180"
            />
          </button>
        </PopoverTrigger>
      ) : anchorRef ? (
        <PopoverAnchor virtualRef={anchorRef} />
      ) : null}
      <PopoverContent
        side="top"
        align="start"
        aria-label={t("Experts", "专家")}
        className="max-w-[calc(100vw-1.5rem)]"
        onInteractOutside={() => {
          interactedOutside.current = true;
        }}
        onCloseAutoFocus={(event) => {
          // Without a chip, return focus to + unless the user moved it outside.
          if (!chip && !interactedOutside.current && anchorRef?.current) {
            event.preventDefault();
            anchorRef.current.focus();
          }
          interactedOutside.current = false;
        }}
        onKeyDown={(event) => {
          if (
            isKey(event, "Enter") &&
            event.target instanceof HTMLInputElement
          ) {
            event.preventDefault();
          }
        }}
      >
        <ExpertPickerOptions
          recipient={recipient}
          options={options}
          isThreadPicker={isThreadPicker}
          isRosterPending={isRosterPending}
          hasRosterFailed={hasRosterFailed}
          selectionBlocked={selectionBlocked}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

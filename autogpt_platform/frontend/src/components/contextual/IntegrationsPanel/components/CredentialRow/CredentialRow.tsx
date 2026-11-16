"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";

import {
  formatMaskedValue,
  typeBadgeLabel,
  type CredentialView,
} from "../../helpers";
import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  Loading03Icon,
  SquareIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  credential: CredentialView;
  selected: boolean;
  onToggleSelected: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function CredentialRow({
  credential,
  selected,
  onToggleSelected,
  onDelete,
  isDeleting = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-selected={selected}
      className="flex w-full items-center justify-between py-3 pr-5 pl-3 transition-colors data-[selected=true]:bg-surface-hover"
    >
      <div className="flex items-center gap-3">
        {credential.isManaged ? (
          <div className="size-5 shrink-0" aria-hidden="true" />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={t(
              `Select ${credential.title}`,
              `选择 ${credential.title}`,
            )}
            onClick={onToggleSelected}
            className={`shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-action ${
              selected
                ? "text-foreground-emphasis hover:text-foreground-strong"
                : "text-foreground-tertiary hover:text-foreground-body"
            }`}
          >
            {selected ? (
              <Icon icon={CheckmarkSquare02Icon} size={20} />
            ) : (
              <Icon icon={SquareIcon} size={20} />
            )}
          </button>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-body leading-5.5 font-medium text-foreground-base">
              {credential.title === "Manual Entry"
                ? t("Manual Entry", "手动输入")
                : credential.title}
            </span>
            <span className="inline-flex items-center justify-center rounded-lg bg-surface-hover px-2 py-0.5 text-caption leading-5 font-medium text-foreground-body">
              {credential.isSignIn
                ? t("For chats", "用于聊天")
                : typeBadgeLabel(credential.type, t)}
            </span>
          </div>
          <div className="flex items-center gap-3 leading-5">
            <span className="text-caption-sm leading-inherit font-medium tracking-eyebrow text-foreground-body uppercase">
              {credential.blocksNote ?? formatMaskedValue(credential, t)}
            </span>
          </div>
        </div>
      </div>

      {credential.isManaged ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="text-caption-sm leading-inherit font-medium tracking-eyebrow text-foreground-body uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
              >
                {t("Managed", "托管")}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t(
                "Managed by AutoGPT — cannot be removed",
                "由 AutoGPT 托管，无法移除",
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-busy={isDeleting}
          aria-label={t(
            `Delete ${credential.title}`,
            `删除 ${credential.title}`,
          )}
          className="inline-flex size-5 items-center justify-center text-foreground-base transition-colors hover:text-error focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-foreground-base"
        >
          {isDeleting ? (
            <Icon icon={Loading03Icon} size={20} spin />
          ) : (
            <Icon icon={Delete02Icon} size={20} />
          )}
        </button>
      )}
    </div>
  );
}

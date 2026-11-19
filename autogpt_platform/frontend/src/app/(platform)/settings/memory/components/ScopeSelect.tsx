"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

interface Props {
  scopeExpertID: string | null;
  experts: Expert[];
  onSelect: (expertID: string | null) => void;
}

function ScopeCheck({ selected }: { selected: boolean }) {
  if (!selected) return null;
  return (
    <span className="ml-auto flex shrink-0 text-brand">
      <Icon icon={Tick02Icon} size={16} />
    </span>
  );
}

export function ScopeSelect({ scopeExpertID, experts, onSelect }: Props) {
  const { t, locale } = useTranslation();
  const selectedExpert = scopeExpertID
    ? experts.find((expert) => expert.id === scopeExpertID)
    : undefined;
  const selectedTitle = scopeExpertID
    ? getExpertDisplayTitle(selectedExpert, locale)
    : "Otto";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("Memory scope", "记忆范围")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-medium border border-border-base bg-surface px-3 py-2 text-body font-medium text-foreground-base",
            "transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:outline-none",
            "data-[state=open]:border-brand",
          )}
        >
          {scopeExpertID ? (
            <ExpertAvatar
              name={selectedTitle}
              avatarUrl={selectedExpert?.avatar_url ?? null}
              size={24}
            />
          ) : (
            <AutopilotAvatar size={24} />
          )}
          <span className="min-w-0 truncate">{selectedTitle}</span>
          <span className="ml-auto flex shrink-0 text-foreground-tertiary">
            <Icon icon={ArrowDown01Icon} size={16} />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // oxlint-disable-next-line design-system/no-restyle -- the scope menu is wider, rounder and padded for two-line rows
        className="max-h-96 w-[300px] overflow-y-auto rounded-medium p-1.5"
      >
        <DropdownMenuItem
          // oxlint-disable-next-line design-system/no-restyle -- two-line scope row with an avatar
          className="flex items-start gap-2.5 rounded-small px-2.5 py-2"
          onSelect={() => onSelect(null)}
        >
          <AutopilotAvatar size={28} />
          <span className="flex min-w-0 flex-col leading-snug">
            <span className="text-body font-medium text-foreground-base">
              Otto
            </span>
            <span className="text-caption text-foreground-tertiary">
              {t(
                "Your account memory — everything you do together",
                "你的账户记忆——你们共同完成的所有事情",
              )}
            </span>
          </span>
          <ScopeCheck selected={scopeExpertID === null} />
        </DropdownMenuItem>

        {experts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {/* oxlint-disable-next-line design-system/no-restyle -- the experts group label is an eyebrow, not a menu label */}
            <DropdownMenuLabel className="px-2.5 pt-1.5 pb-0.5 text-tiny leading-inherit font-semibold tracking-caps text-foreground-subtle uppercase">
              {t("Your experts", "你的专家")}
            </DropdownMenuLabel>
            {experts.map((expert) => {
              const title = getExpertDisplayTitle(expert, locale);
              return (
                <DropdownMenuItem
                  key={expert.id}
                  // oxlint-disable-next-line design-system/no-restyle -- scope row with an avatar and selection check
                  className="flex items-center gap-2.5 rounded-small px-2.5 py-2"
                  onSelect={() => onSelect(expert.id)}
                >
                  <span aria-hidden className="flex shrink-0">
                    <ExpertAvatar
                      name={title}
                      avatarUrl={expert.avatar_url}
                      size={28}
                    />
                  </span>
                  <span className="truncate text-body font-medium text-foreground-base">
                    {title}
                  </span>
                  <ScopeCheck selected={scopeExpertID === expert.id} />
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

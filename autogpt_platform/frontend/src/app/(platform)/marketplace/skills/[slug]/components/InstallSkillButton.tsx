"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

export const MENU_LABEL = "Install for an expert";

interface Props {
  experts: Expert[];
  isAdding: boolean;
  onAddToLibrary: () => void;
  onAddToExpert: (expert: Expert) => void;
}

/** Installing to your own skills is the main action; the dropdown hands the
 *  skill to one of your experts instead. */
export function InstallSkillButton({
  experts,
  isAdding,
  onAddToLibrary,
  onAddToExpert,
}: Props) {
  const { t } = useTranslation();
  if (experts.length === 0) {
    return (
      <Button
        variant="primary"
        size="small"
        onClick={onAddToLibrary}
        loading={isAdding}
        className="w-full sm:w-auto"
        data-testid="skill-install-button"
      >
        {t("Install skill", "安装技能")}
      </Button>
    );
  }

  return (
    <div className="inline-flex w-full sm:w-auto">
      <Button
        variant="primary"
        size="small"
        onClick={onAddToLibrary}
        loading={isAdding}
        // oxlint-disable-next-line design-system/no-restyle -- the left half of a split button; Button has no split variant
        className="!rounded-r-none border-r-0 sm:w-auto"
        data-testid="skill-install-button"
      >
        {t("Install skill", "安装技能")}
      </Button>
      <ExpertInstallMenu
        experts={experts}
        isAdding={isAdding}
        onAddToExpert={onAddToExpert}
      >
        <Button
          variant="primary"
          size="small"
          aria-label={MENU_LABEL}
          disabled={isAdding}
          // oxlint-disable-next-line design-system/no-restyle -- the right half of a split button; Button has no split variant
          className="!min-w-0 !rounded-l-none border-l border-l-action-foreground/25"
        >
          <Icon icon={ArrowDown01Icon} size={16} aria-hidden />
        </Button>
      </ExpertInstallMenu>
    </div>
  );
}

interface MenuProps {
  experts: Expert[];
  isAdding: boolean;
  onAddToExpert: (expert: Expert) => void;
  children: React.ReactNode;
}

export function ExpertInstallMenu({
  experts,
  isAdding,
  onAddToExpert,
  children,
}: MenuProps) {
  const { locale } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[15rem]">
        <DropdownMenuLabel>
          <Text variant="small-tight" as="div" tone="muted">
            {MENU_LABEL}
          </Text>
        </DropdownMenuLabel>
        {experts.map((expert) => {
          const title = getExpertDisplayTitle(expert, locale);
          return (
            <DropdownMenuItem
              key={expert.id}
              disabled={isAdding}
              onSelect={() => onAddToExpert(expert)}
              textValue={title}
              // oxlint-disable-next-line design-system/no-restyle -- a taller row for the expert's avatar
              className="gap-2.5 py-2"
            >
              <span aria-hidden="true" className="flex shrink-0">
                <ExpertAvatar
                  name={title}
                  avatarUrl={expert.avatar_url}
                  size={24}
                />
              </span>
              <Text as="span" variant="body" className="min-w-0 truncate">
                {title}
              </Text>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

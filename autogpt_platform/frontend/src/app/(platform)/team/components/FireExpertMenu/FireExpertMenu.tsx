"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { Logout03Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";

interface Props {
  expertName: string;
  onFire: () => void;
  testId: string;
}

export function FireExpertMenu({ expertName, onFire, testId }: Props) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          leadingIcon={MoreVerticalIcon}
          aria-label={t(`${expertName} actions`, `${expertName} 的操作`)}
          withTooltip={false}
          data-testid={testId}
          onClick={(event) => event.stopPropagation()}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem
          onSelect={onFire}
          // oxlint-disable-next-line design-system/no-restyle -- DropdownMenuItem has no destructive variant (src/components is P9's)
          className="flex cursor-pointer items-center gap-2 text-error-foreground focus:bg-error-surface focus:text-error-foreground"
        >
          <Icon icon={Logout03Icon} size={14} />
          {t(`Fire ${expertName}`, `解雇 ${expertName}`)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

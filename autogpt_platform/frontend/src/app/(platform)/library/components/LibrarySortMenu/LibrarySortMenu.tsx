"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { LibraryAgentSort } from "@/app/api/__generated__/models/libraryAgentSort";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { SortByDown02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useLibrarySortMenu } from "./useLibrarySortMenu";

interface Props {
  setLibrarySort: (value: LibraryAgentSort) => void;
}

export function LibrarySortMenu({ setLibrarySort }: Props) {
  const { t } = useTranslation();
  const { handleSortChange } = useLibrarySortMenu({ setLibrarySort });
  return (
    <div className="flex items-center" data-testid="sort-by-dropdown">
      <span className="hidden text-body whitespace-nowrap text-foreground-tertiary sm:inline">
        {t("sort by", "排序")}
      </span>
      <Select onValueChange={handleSortChange}>
        <SelectTrigger
          // oxlint-disable-next-line design-system/no-restyle -- Select has no inline link-style trigger variant
          className="!m-0 ml-1 w-fit space-x-1 border-none !bg-transparent px-4 text-body underline underline-offset-4 !shadow-none !ring-offset-transparent"
        >
          <Icon
            aria-hidden
            icon={SortByDown02Icon}
            className="h-4 w-4 sm:hidden"
          />
          <SelectValue placeholder={t("Last Modified", "最后修改")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={LibraryAgentSort.createdAt}>
              {t("Creation Date", "创建日期")}
            </SelectItem>
            <SelectItem value={LibraryAgentSort.updatedAt}>
              {t("Last Modified", "最后修改")}
            </SelectItem>
            <SelectItem value={LibraryAgentSort.lastRunAt}>
              {t("Last Run", "上次运行")}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

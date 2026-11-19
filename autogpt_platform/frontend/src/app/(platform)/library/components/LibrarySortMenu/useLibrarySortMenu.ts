import { LibraryAgentSort } from "@/app/api/__generated__/models/libraryAgentSort";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  setLibrarySort: (value: LibraryAgentSort) => void;
}

export function useLibrarySortMenu({ setLibrarySort }: Props) {
  const { t } = useTranslation();
  const handleSortChange = (value: LibraryAgentSort) => {
    setLibrarySort(value);
  };

  const getSortLabel = (sort: LibraryAgentSort) => {
    switch (sort) {
      case LibraryAgentSort.createdAt:
        return t("Creation Date", "创建日期");
      case LibraryAgentSort.updatedAt:
        return t("Last Modified", "最后修改");
      case LibraryAgentSort.lastRunAt:
        return t("Last Run", "上次运行");
      default:
        return t("Last Modified", "最后修改");
    }
  };

  return {
    handleSortChange,
    getSortLabel,
  };
}

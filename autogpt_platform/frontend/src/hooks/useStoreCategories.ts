import { useGetV2ListStoreCategories } from "@/app/api/__generated__/endpoints/store/store";
import { StoreCategoryInfo } from "@/app/api/__generated__/models/storeCategoryInfo";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useStoreCategories({ enabled = true } = {}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetV2ListStoreCategories({
    query: {
      enabled,
      // The canonical set only changes with a deploy.
      staleTime: Infinity,
      select: (x) => x.data as StoreCategoryInfo[],
    },
  });

  return {
    categories: data ?? [],
    isLoading,
    isUnavailable: isLoading || isError,
    // The two publish forms render the same required select; keeping the copy
    // here is what stops them drifting apart.
    placeholder: isLoading
      ? t("Loading categories…", "正在加载分类…")
      : isError
        ? t("Categories unavailable", "分类暂不可用")
        : t("Select a category", "选择分类"),
  };
}

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { blockMenuContainerStyle } from "../style";
import { BlockMenuFilters } from "../BlockMenuFilters/BlockMenuFilters";
import { BlockMenuSearchContent } from "../BlockMenuSearchContent/BlockMenuSearchContent";

export const BlockMenuSearch = () => {
  const { t } = useTranslation();
  return (
    <div
      className={blockMenuContainerStyle}
      data-id="blocks-control-search-results"
    >
      <BlockMenuFilters />
      <Text variant="body-medium">{t("Search results", "搜索结果")}</Text>
      <BlockMenuSearchContent />
    </div>
  );
};

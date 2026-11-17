import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Sad01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

export const NoSearchResult = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <Icon icon={Sad01Icon} size={64} tone="subtle" className="mb-10" />
      <div className="space-y-1">
        <Text variant="body-medium" tone="emphasis">
          {t("No match found", "未找到匹配结果")}
        </Text>
        <Text variant="body" tone="secondary">
          {t("Try adjusting your search terms", "请尝试调整搜索关键词")}
        </Text>
      </div>
    </div>
  );
};

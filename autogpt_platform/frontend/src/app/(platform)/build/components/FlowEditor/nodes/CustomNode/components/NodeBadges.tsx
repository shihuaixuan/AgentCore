import { BlockInfoCategoriesItem } from "@/app/api/__generated__/models/blockInfoCategoriesItem";
import { Badge } from "@/components/atoms/Badge/Badge";
import { getBuilderCategoryLabel } from "@/app/(platform)/build/helpers/blockCopy";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export const NodeBadges = ({
  categories,
}: {
  categories: BlockInfoCategoriesItem[];
}) => {
  const { locale } = useTranslation();
  return categories.map((category) => (
    <Badge
      key={category.category}
      variant="solid"
      className={cn(
        "rounded-full border border-foreground-tertiary bg-surface-hover text-foreground-base shadow-none",
      )}
    >
      {getBuilderCategoryLabel(category.category, locale)}
    </Badge>
  ));
};

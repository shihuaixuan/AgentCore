import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { BrowseCategory } from "../Browse/BrowseFilters";
import { getCategoryAccent } from "../ExpertsSection/helpers";

interface Props {
  categories: BrowseCategory[];
  experts: ExpertTemplate[];
  onSelect: (category: string) => void;
}

export function ExpertRecommendations({
  categories,
  experts,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const groups = categories
    .map((category) => ({
      ...category,
      experts: experts.filter((expert) =>
        expert.categories?.includes(category.value),
      ),
    }))
    .filter((group) => group.experts.length > 0)
    .sort((left, right) => right.experts.length - left.experts.length)
    .slice(0, 4);

  if (groups.length === 0) return null;

  return (
    <section
      aria-label={t("Featured expert categories", "推荐专家分类")}
      className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {groups.map((group) => {
        const { accent, icon } = getCategoryAccent(group.value);
        return (
          <div
            key={group.value}
            className="overflow-hidden rounded-xl border border-border-base bg-surface"
          >
            <button
              type="button"
              onClick={() => onSelect(group.value)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-3 text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset",
                accent.band,
              )}
            >
              <Text variant="body-medium" as="span">
                {group.label}
              </Text>
              {icon && <Icon icon={icon} size={19} aria-hidden />}
            </button>
            <ul className="space-y-1 px-4 py-2">
              {group.experts.slice(0, 3).map((expert) => (
                <li key={expert.id}>
                  <Link
                    href={`/marketplace/experts/${expert.id}`}
                    className="flex items-center justify-between gap-2 rounded-md py-1 text-body-sm text-foreground-body hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <span className="truncate">{expert.name}</span>
                    <Icon icon={ArrowRight02Icon} size={14} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

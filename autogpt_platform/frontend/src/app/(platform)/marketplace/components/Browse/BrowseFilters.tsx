"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useStoreCategories } from "@/hooks/useStoreCategories";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export type BrowseCategory = { value: string; label: string };

const labels: Record<string, [string, string, string]> = {
  marketing: ["市场营销", "营销运营", "推广获客"],
  sales: ["销售商务", "销售工具", "销售流程"],
  finance: ["金融财务", "财务分析", "财务自动化"],
  support: ["客户服务", "客服支持", "客户支持"],
  operations: ["运营管理", "办公效率", "办公自动化"],
  research: ["研究分析", "数据分析", "信息收集"],
  content: ["内容创作", "写作与设计", "内容生产"],
  development: ["技术工程", "开发工具", "工程自动化"],
};

const browseOrder = {
  experts: [
    "development",
    "content",
    "marketing",
    "operations",
    "finance",
    "research",
    "sales",
    "support",
  ],
  skills: [
    "content",
    "development",
    "research",
    "operations",
    "marketing",
    "sales",
    "support",
    "finance",
  ],
  workflows: [
    "operations",
    "marketing",
    "research",
    "development",
    "sales",
    "content",
    "support",
    "finance",
  ],
};

export function useBrowseCategories(type: keyof typeof browseOrder) {
  const { t } = useTranslation();
  const { categories } = useStoreCategories();
  const index = type === "experts" ? 0 : type === "skills" ? 1 : 2;
  const rank = new Map(
    browseOrder[type].map((value, position) => [value, position]),
  );
  return categories
    .map(({ value, label }) => ({
      value,
      label: t(label, labels[value]?.[index] ?? label),
    }))
    .sort(
      (left, right) =>
        (rank.get(left.value) ?? rank.size) -
        (rank.get(right.value) ?? rank.size),
    );
}

interface Props {
  label: string;
  categories: BrowseCategory[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function BrowseFilters({
  label,
  categories,
  selected,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  if (categories.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
    >
      {[{ value: null, label: t("All", "全部") }, ...categories].map(
        (category) => (
          <Button
            key={category.value ?? "all"}
            size="xs"
            variant="toggle"
            aria-pressed={selected === category.value}
            onClick={() =>
              onSelect(category.value === selected ? null : category.value)
            }
          >
            {category.label}
          </Button>
        ),
      )}
    </div>
  );
}

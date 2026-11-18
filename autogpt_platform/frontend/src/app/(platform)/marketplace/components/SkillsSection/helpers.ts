import type { Locale } from "@/lib/i18n/locale";

/** One page of the browse-all grid. */
export const BROWSE_PAGE_SIZE = 20;

const CHINESE_CATEGORY_LABELS: Record<string, string> = {
  marketing: "市场营销",
  sales: "销售商务",
  finance: "金融财务",
  support: "客户服务",
  operations: "运营管理",
  research: "研究分析",
  content: "内容创作",
  development: "技术工程",
};

export function formatCategoryLabel(
  category: string,
  locale: Locale = "en",
): string {
  if (
    locale === "zh-CN" &&
    Object.hasOwn(CHINESE_CATEGORY_LABELS, category.toLowerCase())
  ) {
    return CHINESE_CATEGORY_LABELS[category.toLowerCase()];
  }
  const words = category.replace(/[-_]+/g, " ").trim();
  if (!words) return category;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

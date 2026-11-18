import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { formatCategoryLabel } from "../SkillsSection/helpers";
import { CategoryTag } from "./CategoryTag";

afterEach(cleanup);

test.each([
  ["development", "技术工程"],
  ["marketing", "市场营销"],
  ["sales", "销售商务"],
  ["finance", "金融财务"],
  ["support", "客户服务"],
  ["operations", "运营管理"],
  ["research", "研究分析"],
  ["content", "内容创作"],
  ["my-custom-topic", "My custom topic"],
])(
  "localizes category %s without changing custom categories",
  (category, label) => {
    render(
      <LanguageProvider>
        <CategoryTag category={category} />
      </LanguageProvider>,
    );

    expect(screen.getByText(label)).toBeDefined();
  },
);

test.each([
  ["constructor", "Constructor"],
  ["__proto__", "Proto"],
])("humanizes custom category %s as plain text", (category, label) => {
  expect(formatCategoryLabel(category, "zh-CN")).toBe(label);
});

test("keeps the English category label available", () => {
  render(
    <LanguageProvider initialLocale="en">
      <CategoryTag category="development" />
    </LanguageProvider>,
  );

  expect(screen.getByText("Development")).toBeDefined();
});

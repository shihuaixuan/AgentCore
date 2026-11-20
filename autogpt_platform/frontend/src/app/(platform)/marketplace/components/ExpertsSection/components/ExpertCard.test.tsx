import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import { fireEvent, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CompactExpertCard } from "../../MainMarketplacePage/CompactExpertCard";
import { ExpertCard } from "./ExpertCard";

vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isLoggedIn: false }),
}));

const expert: ExpertTemplate = {
  id: "casey-template",
  name: "凯西",
  role: "质量保障工程师",
  avatar_url: null,
  tagline: null,
  bio: null,
  skills: [],
  categories: ["development"],
  identity: "",
  voice_preferences: "",
  boundaries: "",
  protected_soul_rules: [],
  is_template: true,
  source_template_id: null,
  is_archived: false,
  workflows: [],
  bundled_skills: Array.from({ length: 5 }, (_, index) => ({
    id: `skill-${index}`,
    slug: `skill-${index}`,
    title: `Original skill ${index}`,
    description: "Creator-authored description",
  })),
};

describe.each([
  ["directory", CompactExpertCard],
  ["search", ExpertCard],
] as const)("%s expert card", (_surface, Card) => {
  test("headlines the job title and shows the built-in professional portrait", () => {
    render(
      <Card
        expert={{
          ...expert,
          role: "代码审查与质量保障",
          job_title: "质量保障工程师",
          avatar_url: "/autogpt-characters/v2.1/expert-casey/neutral/128.webp",
        }}
        isHired={false}
        categories={[]}
      />,
    );

    const link = screen.getByRole("link", { name: /质量保障工程师/ });
    expect(
      within(link).getByRole("heading", { name: "质量保障工程师" }),
    ).toBeDefined();
    expect(within(link).queryByText("凯西")).toBeNull();
    expect(link.querySelector("img")?.getAttribute("src")).toBe(
      "/experts/professional/expert-casey.webp",
    );
    const portrait = link.querySelector("img");
    if (!portrait) throw new Error("Expected a professional portrait");
    fireEvent.error(portrait);
    expect(link.querySelector('[data-slot="expert-avatar"]')?.textContent).toBe(
      "凯西",
    );
  });

  test("falls back to the localized role when the job title is blank", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Card
          expert={{ ...expert, role: "Sales", job_title: " " }}
          isHired={false}
          categories={[]}
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "销售开发代表" })).toBeDefined();
  });
});

test.each([
  ["zh-CN", "技能：", "+2 项技能", "技术工程"],
  ["en", "Skills:", "+2 skills", "Development"],
] as const)(
  "localizes expert card skill labels in %s",
  (locale, title, count, category) => {
    render(
      <LanguageProvider initialLocale={locale}>
        <ExpertCard expert={expert} isHired={false} />
      </LanguageProvider>,
    );

    expect(screen.getByText(title)).toBeDefined();
    expect(screen.getByText(count)).toBeDefined();
    expect(screen.getByText(category)).toBeDefined();
    expect(screen.getByText("Original skill 0")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /Original skill 0/ })
        .getAttribute("href"),
    ).toBe("/marketplace/experts/casey-template");
  },
);

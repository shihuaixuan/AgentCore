import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
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

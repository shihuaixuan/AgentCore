import type { MarketplaceSkill } from "@/app/api/__generated__/models/marketplaceSkill";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test, vi } from "vitest";
import { CreatorCard } from "../components/CreatorCard/CreatorCard";
import { SkillCard } from "../components/SkillsSection/components/SkillCard";
import { StoreCard } from "../components/StoreCard/StoreCard";

const skill: MarketplaceSkill = {
  slug: "original-skill",
  name: "original-skill",
  title: "Original Skill",
  description: "Original English description",
  categories: ["content"],
  required_providers: [],
  install_count: 1234,
  creator: "Original Creator",
  source_repo: "original/repo",
};

describe.each([
  {
    locale: "zh-CN" as Locale,
    card: "Original Workflow 工作流卡片",
    preview: "Original Workflow 预览图",
    runs: "运行 1,234 次",
    rating: "评分：4.5 / 5 星",
    creator: "创建者：Original Creator",
    source: "来源：original/repo",
    installs: "已安装 1,234 次",
    workflows: "1 个工作流",
  },
  {
    locale: "en" as Locale,
    card: "Original Workflow workflow card",
    preview: "Original Workflow preview image",
    runs: "1,234 runs",
    rating: "Rating: 4.5 out of 5 stars",
    creator: "by Original Creator",
    source: "From original/repo",
    installs: "1,234 installed",
    workflows: "1 workflow",
  },
])(
  "$locale marketplace cards",
  ({
    locale,
    card,
    preview,
    runs,
    rating,
    creator,
    source,
    installs,
    workflows,
  }) => {
    test("localizes workflow accessible names, runs and rating without altering content or actions", () => {
      const onClick = vi.fn();
      render(
        <LanguageProvider initialLocale={locale}>
          <StoreCard
            agentName="Original Workflow"
            agentImage="/original-preview.png"
            description="Original English description"
            runs={1234}
            rating={4.5}
            onClick={onClick}
            avatarSrc=""
            creatorName="Original Creator"
          />
        </LanguageProvider>,
      );

      expect(screen.getByRole("button", { name: card })).toBeDefined();
      expect(
        screen.getByRole("img", { name: preview }).getAttribute("src"),
      ).toContain("original-preview.png");
      expect(screen.getByRole("img", { name: rating })).toBeDefined();
      expect(screen.getByText(runs, { exact: false })).toBeDefined();
      expect(screen.getByText(creator)).toBeDefined();
      expect(screen.getByText("Original English description")).toBeDefined();
    });

    test("localizes the skill source and install count without showing the author", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <SkillCard skill={skill} isInstalled={false} />
        </LanguageProvider>,
      );
      expect(screen.getByRole("link").getAttribute("href")).toBe(
        "/marketplace/skills/original-skill",
      );
      expect(screen.queryByText(/Original Creator/)).toBeNull();
      expect(screen.getByText(source)).toBeDefined();
      expect(screen.getByText(installs)).toBeDefined();
      expect(screen.getByText(skill.title)).toBeDefined();
      expect(screen.getByText(skill.description)).toBeDefined();
    });

    test("localizes creator workflow counts without translating names or biography", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <CreatorCard
            creatorName="Original Creator"
            creatorImage={null}
            bio="Original biography"
            agentsUploaded={1}
            onClick={vi.fn()}
            index={0}
          />
        </LanguageProvider>,
      );
      expect(screen.getByText(workflows)).toBeDefined();
      expect(
        screen.getByRole("heading", { name: "Original Creator" }),
      ).toBeDefined();
      expect(screen.getByText("Original biography")).toBeDefined();
    });
  },
);

test("keeps English workflow card templates outside the language provider", () => {
  render(
    <StoreCard
      agentName="Original"
      agentImage=""
      description="Raw description"
      runs={0}
      rating={0}
      onClick={vi.fn()}
      avatarSrc=""
    />,
  );
  expect(
    screen.getByRole("button", { name: "Original workflow card" }),
  ).toBeDefined();
  expect(screen.getByText("No runs")).toBeDefined();
});

import type { Expert } from "@/app/api/__generated__/models/expert";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test, vi } from "vitest";
import { PodBoard } from "../components/PodBoard/PodBoard";
import { ExpertActivityGraph } from "../[expertId]/components/ExpertActivityGraph/ExpertActivityGraph";
import { ProfileEntry } from "../[expertId]/components/ProfileEntry";
import { WorkflowCredentialStack } from "../[expertId]/components/WorkflowCredentialStack";

const expert: Expert = {
  id: "original-expert",
  name: "Original Nova",
  role: "Custom Role",
  avatar_url: null,
  tagline: null,
  bio: null,
  skills: [],
  identity: "Original identity",
  voice_preferences: "Original voice",
  boundaries: "",
  protected_soul_rules: [],
  is_template: false,
  source_template_id: null,
  is_archived: false,
  workflows: [],
};

describe.each([
  {
    locale: "zh-CN" as Locale,
    count: "1 位专家",
    open: "打开 Original Pod 小组",
    range: "最近 1 周的活动",
    day: "11月16日：2 次会话、1 次运行",
    missing: "尚未设置。",
    more: "另外 1 个",
  },
  {
    locale: "en" as Locale,
    count: "1 expert",
    open: "Open Original Pod pod",
    range: "Activity over the last 1 weeks",
    day: "2 sessions, 1 run on Nov 16",
    missing: "Not set yet.",
    more: "1 more",
  },
])(
  "$locale team templates",
  ({ locale, count, open, range, day, missing, more }) => {
    test("localizes pod counts before and after opening while preserving pod and expert names", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <PodBoard
            isLoading={false}
            podGroups={[
              {
                pod: {
                  id: "original-pod",
                  name: "Original Pod",
                  created_at: new Date("2026-11-01"),
                },
                experts: [expert],
              },
            ]}
            onNewPod={vi.fn()}
            renderCard={(member) => <p key={member.id}>{member.name}</p>}
          />
        </LanguageProvider>,
      );
      expect(screen.getByText(count)).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: open }));
      expect(screen.getByText(count)).toBeDefined();
      expect(screen.getByText(expert.name)).toBeDefined();
      expect(screen.getByText("Original Pod")).toBeDefined();
    });

    test("localizes activity summaries, missing profile values and hidden credentials", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <ExpertActivityGraph
            days={[
              { day: "2026-11-16" as unknown as Date, sessions: 2, runs: 1 },
            ]}
          />
          <dl>
            <ProfileEntry label="Original Label" value={null} />
            <ProfileEntry label="Custom Label" value="Original profile text" />
          </dl>
          <WorkflowCredentialStack
            providers={["google", "github", "slack", "notion"]}
          />
        </LanguageProvider>,
      );
      expect(screen.getByRole("img", { name: range })).toBeDefined();
      expect(screen.getByTitle(day)).toBeDefined();
      expect(screen.getByText(missing)).toBeDefined();
      expect(screen.getByText("Original profile text")).toBeDefined();
      expect(screen.getByRole("listitem", { name: more })).toBeDefined();
    });
  },
);

test("keeps English profile fallback outside the language provider", () => {
  render(
    <dl>
      <ProfileEntry label="Original Label" value={null} />
    </dl>,
  );
  expect(screen.getByText("Not set yet.")).toBeDefined();
});

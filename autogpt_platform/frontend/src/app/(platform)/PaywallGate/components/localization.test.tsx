import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import { expect, it } from "vitest";
import { PaywallHeader } from "./PaywallHeader";
import { PaywallPlanChoices } from "./PaywallPlanChoices";
import { PausedSchedulesNotice } from "./PausedSchedulesNotice";
import { PLANS } from "@/components/molecules/PlanCard/plans";

it("localizes the subscription gate without hiding saved-data reassurance", () => {
  render(
    <LanguageProvider>
      <PaywallHeader />
    </LanguageProvider>,
  );
  expect(screen.getByText("选择套餐以继续使用")).toBeDefined();
  expect(screen.getByText("你的对话、工作流和文件均已保存。")).toBeDefined();
});

it("localizes plan features and paused schedules while preserving plan keys", () => {
  render(
    <LanguageProvider>
      <PaywallPlanChoices
        plans={PLANS}
        cycle="monthly"
        onCycle={() => {}}
        onSelect={() => {}}
        pending={false}
        selectedTier={null}
      />
      <PausedSchedulesNotice count={3} />
    </LanguageProvider>,
  );
  expect(screen.getByRole("group", { name: "计费周期" })).toBeDefined();
  expect(
    screen.getByText("由 通用办公助手 协调内容、销售和研究领域的专家"),
  ).toBeDefined();
  expect(
    screen.getByText("你的 3 个定时工作流已暂停，订阅后即可恢复。"),
  ).toBeDefined();
});

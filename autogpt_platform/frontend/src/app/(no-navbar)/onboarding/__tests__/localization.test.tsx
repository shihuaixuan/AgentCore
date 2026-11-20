import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AmbientCard } from "../steps/BrainDumpStep/components/AmbientCard";
import { AutopilotScene } from "../steps/IntroStep/components/AutopilotScene";
import { TeamScene } from "../steps/IntroStep/components/TeamScene";
import { PlanProgressCard } from "../steps/SubscriptionStep/components/PlanPanel/PlanProgressCard";

describe("onboarding localization", () => {
  it.each([
    [
      "en",
      [
        "I help plan and coordinate your work.",
        "When an expert gets stuck, I step in.",
        "I delegate tasks across the team.",
        "I suggest Experts you can hire.",
      ],
    ],
    [
      "zh-CN",
      [
        "我帮你规划和协调工作。",
        "专家遇到困难时，我会出手相助。",
        "我把任务分配给团队成员。",
        "我会推荐适合你聘用的专家。",
      ],
    ],
  ] as const)("shows the assistant's intro points in %s", (locale, points) => {
    render(
      <LanguageProvider initialLocale={locale}>
        <AutopilotScene />
      </LanguageProvider>,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(points);
  });

  it.each([
    [
      "Your business",
      "What do you sell, and who buys it?",
      false,
      "你的业务",
      "你销售什么？客户是谁？",
    ],
    [
      "For example",
      "“So, um, I run a little bakery, and honestly the ordering side is killing me.”",
      true,
      "例如",
      "“我经营一家小面包店，订单处理实在太耗精力了。”",
    ],
  ])(
    "localizes visible ambient content for %s",
    (label, text, isQuote, translatedLabel, translatedText) => {
      render(
        <LanguageProvider>
          <AmbientCard
            position=""
            content={{ label, text, isQuote }}
            isHidden={false}
            drift={null}
            reduceMotion
          />
        </LanguageProvider>,
      );
      expect(screen.getByText(translatedLabel)).toBeDefined();
      expect(screen.getByText(translatedText)).toBeDefined();
    },
  );

  it("leaves unknown ambient content and English fallback unchanged", () => {
    const content = {
      label: "Raw label",
      text: "Customer content https://example.com/Report_ID",
      isQuote: false,
    };
    const page = render(
      <LanguageProvider>
        <AmbientCard
          position=""
          content={content}
          isHidden={false}
          drift={null}
          reduceMotion
        />
      </LanguageProvider>,
    );
    expect(screen.getByText(content.text)).toBeDefined();
    page.unmount();
    render(
      <AmbientCard
        position=""
        content={{
          label: "Your business",
          text: "What do you sell, and who buys it?",
          isQuote: false,
        }}
        isHidden={false}
        drift={null}
        reduceMotion
      />,
    );
    expect(screen.getByText("Your business")).toBeDefined();
    expect(
      screen.getByText("What do you sell, and who buys it?"),
    ).toBeDefined();
  });

  it("shows translated plan progress instead of translating only list keys", () => {
    render(
      <LanguageProvider>
        <PlanProgressCard
          progress={{ tasks_written: true, team_chosen: false }}
        />
      </LanguageProvider>,
    );
    const progress = within(screen.getByRole("list", { name: "正在制定计划" }));
    expect(progress.getByText("正在将工作描述整理为任务")).toBeDefined();
    expect(progress.getByText("正在寻找适合你的专家")).toBeDefined();
    expect(progress.getByText("正在为每项任务安排负责人")).toBeDefined();
  });

  it("localizes the team titles including the default assistant", () => {
    render(
      <LanguageProvider>
        <TeamScene />
      </LanguageProvider>,
    );
    const members = within(
      screen.getByRole("list", { name: "你的团队" }),
    ).getAllByRole("listitem");
    expect(members.map((member) => member.textContent)).toEqual([
      "通用办公助手",
      "SEO 内容经理",
      "销售开发代表",
      "记账员",
      "市场研究分析师",
      "客户成功经理",
      "行政助理",
      "应用安全工程师",
    ]);
    expect(members[0].querySelector("img")?.getAttribute("src")).toBe(
      "/experts/professional/office-assistant.webp",
    );
  });
});

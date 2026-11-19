import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AutopilotUsageCard } from "../components/SubscriptionTab/AutopilotUsageCard/AutopilotUsageCard";
import { MaxUpgradeSummary } from "../components/SubscriptionTab/YourPlanCard/MaxUpgradeSummary";
import { MaxUpgradeReview } from "../components/SubscriptionTab/YourPlanCard/MaxUpgradeReview";
import type { SubscriptionUpgradePreview } from "@/app/api/__generated__/models/subscriptionUpgradePreview";
import { BalanceCard } from "../components/AutomationCreditsTab/BalanceCard/BalanceCard";
import { TransactionHistoryCard } from "../components/AutomationCreditsTab/TransactionHistoryCard/TransactionHistoryCard";
import { PaymentMethodCard } from "../components/SubscriptionTab/PaymentMethodCard/PaymentMethodCard";
import { UsageUnavailable } from "../components/SubscriptionTab/AutopilotUsageCard/UsageUnavailable";
import { CycleToggle } from "../components/SubscriptionTab/YourPlanCard/CycleToggle";
import { YourPlanCard } from "../components/SubscriptionTab/YourPlanCard/YourPlanCard";
import { server } from "@/mocks/mock-server";
import { http, HttpResponse } from "msw";

const usage = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  inactive: false,
  unlimited: false,
  hasUsage: true,
  lifetime: true,
  status: { tone: "muted", label: "Plenty left" },
  featured: {
    label: "试用用量",
    percent: 25,
    prefix: "试用结束",
    value: "11月30日",
  },
  secondary: null,
}));

vi.mock(
  "../components/SubscriptionTab/AutopilotUsageCard/useAutopilotUsageCard",
  () => ({ useAutopilotUsageCard: () => usage }),
);

const preview: SubscriptionUpgradePreview = {
  preview_id: "preview-1",
  amount_due: 2500,
  tax_amount: 500,
  tax_included: false,
  adjustment_amount: 0,
  currency: "usd",
  proration_date: 1761955200,
  period_end: 1764547200,
  expires_at: 1762041600,
  recurring_amount: 10000,
  recurring_tax_included: false,
  billing_cycle: "monthly",
  lines: [],
};

describe("billing comprehensive Chinese localization", () => {
  test("translates trial explanations, percentages and progress labels", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <AutopilotUsageCard />
      </LanguageProvider>,
    );
    expect(screen.getByText("整个试用期共用一份额度")).toBeDefined();
    expect(
      screen.getByText("此额度适用于整个试用期，不会每天或每周重置。"),
    ).toBeDefined();
    expect(
      screen
        .getByRole("progressbar", { name: "试用用量用量" })
        .getAttribute("aria-valuenow"),
    ).toBe("25");
    expect(
      screen.getByText(
        "请求越复杂，消耗的额度越多。达到上限不会产生额外费用。",
      ),
    ).toBeDefined();
    expect(screen.getByText("已使用 25%")).toBeDefined();
  });

  test("translates invoice-owned labels but preserves Max and USD amounts", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <MaxUpgradeSummary preview={preview} />
      </LanguageProvider>,
    );
    expect(screen.getByText("税费")).toBeDefined();
    expect(screen.getByText(/下次续费：/)).toBeDefined();
    expect(screen.getByText(/Max 的标准价格为每月/)).toBeDefined();
    expect(screen.getByText(/不含适用税费/)).toBeDefined();
    expect(screen.getByText(/100.*\/.*月/)).toBeDefined();
  });

  test("translates the review loading state", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <MaxUpgradeReview
          review={{
            required: true,
            isLoading: true,
            error: "",
            preview: undefined,
            retry: vi.fn(),
            invalidate: vi.fn(),
          }}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("正在核对费用…")).toBeDefined();
  });

  test("retains English review copy without a provider", () => {
    render(
      <MaxUpgradeReview
        review={{
          required: true,
          isLoading: true,
          error: "",
          preview: undefined,
          retry: vi.fn(),
          invalidate: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("Reviewing your charge…")).toBeDefined();
  });

  test("translates balance guidance and checkout explanations", async () => {
    server.use(
      http.get("*/api/credits", () => HttpResponse.json({ credits: 1500 })),
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <BalanceCard />
      </LanguageProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "充值额度" }));
    expect(screen.getByText("即将跳转至 Stripe 完成购买。")).toBeDefined();
  });

  test("translates empty transaction guidance without changing the currency", async () => {
    server.use(
      http.get("*/api/credits/transactions", () =>
        HttpResponse.json({ transactions: [], next_transaction_time: null }),
      ),
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <TransactionHistoryCard />
      </LanguageProvider>,
    );
    expect(
      await screen.findByText("购买积分和付费活动将显示在这里。"),
    ).toBeDefined();
    expect(screen.getByText("USD · 你的当地时间")).toBeDefined();
    expect(screen.getByText("自动化积分余额的变动记录。")).toBeDefined();
  });

  test("translates payment and unavailable usage guidance while preserving retry", () => {
    const onRetry = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <PaymentMethodCard />
        <UsageUnavailable onRetry={onRetry} />
      </LanguageProvider>,
    );
    expect(
      screen.getByText("打开 Stripe 门户以更新银行卡或下载发票。"),
    ).toBeDefined();
    expect(
      screen.getByText("你的套餐和工作内容不受影响。请稍后重试。"),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  test("translates cycle options without changing their values", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <CycleToggle value="monthly" onChange={onChange} />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("radio", { name: "每月" }).getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "每年 节省 15%" }));
    expect(onChange).toHaveBeenCalledWith("yearly");
  });

  test("localizes no-subscription captions returned by the plan controller", async () => {
    server.use(
      http.get("*/api/credits/subscription", () =>
        HttpResponse.json({
          tier: "NO_TIER",
          monthly_cost: 0,
          has_active_stripe_subscription: false,
        }),
      ),
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <YourPlanCard />
      </LanguageProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "无有效订阅" }),
    ).toBeDefined();
    expect(screen.getByText("选择套餐以继续使用 AutoGPT。")).toBeDefined();
  });
});

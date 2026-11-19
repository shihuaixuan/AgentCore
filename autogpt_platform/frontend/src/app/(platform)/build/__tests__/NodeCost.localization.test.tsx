import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { BlockCost } from "@/app/api/__generated__/models/blockCost";
import { NodeCost } from "../components/FlowEditor/nodes/CustomNode/components/NodeCost";

vi.mock("@/hooks/useCredits", () => ({
  default: () => ({ formatCredits: (value: number) => String(value) }),
}));
vi.mock("@/hooks/useIsBillingEnabled", () => ({
  useIsBillingEnabled: () => true,
}));

function renderCost(cost: Partial<BlockCost>, chinese = true) {
  const component = (
    <NodeCost
      nodeId="unchanged-node-ID"
      blockCosts={[
        {
          cost_type: "run",
          cost_amount: 0,
          cost_filter: {},
          ...cost,
        } as BlockCost,
      ]}
    />
  );
  render(
    chinese ? (
      <LanguageProvider initialLocale="zh-CN">{component}</LanguageProvider>
    ) : (
      component
    ),
  );
}

describe("localized node cost display", () => {
  it("describes free execution in Chinese", () => {
    renderCost({});
    expect(screen.getByText("免费")).toBeDefined();
  });

  it("localizes token and cache prices without changing USD amounts", () => {
    renderCost({
      token_rate: {
        input_usd_per_1m: 2,
        output_usd_per_1m: 6,
        cache_read_usd_per_1m: 0.5,
        cache_creation_usd_per_1m: 3,
      },
    });
    expect(screen.getByText("$2.00 输入 / $6.00 输出")).toBeDefined();
    expect(
      screen.getByTitle(/缓存读取：\$0.50/).getAttribute("title"),
    ).toContain("缓存写入：$3.00");
    expect(screen.getByText("每百万 token")).toBeDefined();
  });

  it("keeps per-item divisors and translates the unit", () => {
    renderCost({ cost_type: "items", cost_amount: 4, cost_divisor: 10 });
    expect(screen.getByText("/ 10 项")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
  });

  it("retains English default pricing", () => {
    renderCost({}, false);
    expect(screen.getByText("Free")).toBeDefined();
  });

  it("localizes usage-based pricing and its explanation", () => {
    renderCost({ cost_type: "cost_usd", cost_amount: 7 });
    expect(screen.getByText("按量付费")).toBeDefined();
    expect(screen.getByTitle(/按量付费.*1\.5×/)).toBeDefined();
  });

  it.each([
    ["run", 1, "/次运行"],
    ["byte", 1, "/字节"],
    ["second", 1, "/秒"],
    ["second", 10, "/ 10 秒"],
    ["items", 1, "/项"],
    ["tokens", 1, "/次运行"],
  ] as const)(
    "localizes %s pricing with divisor %s",
    (costType, divisor, suffix) => {
      renderCost({
        cost_type: costType,
        cost_amount: 4,
        cost_divisor: divisor,
      });
      expect(screen.getByText(suffix)).toBeDefined();
      expect(screen.getByText("4")).toBeDefined();
      if (costType === "tokens") {
        expect(screen.getByTitle(/预估.*token/)).toBeDefined();
      }
    },
  );
});

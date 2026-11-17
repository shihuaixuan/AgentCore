import { expect, it } from "vitest";
import { getUsageExperience } from "../helpers";
import { usagePresentation } from "../presentation";
import { formatPaymentDue } from "../payment";

it("renders complete Chinese allowance messages while keeping English available", () => {
  const model = getUsageExperience({
    tier: "PRO",
    weekly: { percent_used: 100, resets_at: "2026-11-17T00:00:00Z" },
  });
  const chinese = usagePresentation(model, 5, "zh-CN");
  expect(chinese.title).toBe("已达到本周使用上限");
  expect(chinese.description).toContain("5 倍");
  expect(chinese.secondary).toBe("等待额度重置");
  expect(usagePresentation(model).title).toBe("You’ve hit this week’s limit");
  expect(formatPaymentDue(null, "zh-CN")).toBeNull();
});

it("keeps the year for a future reset and falls back for invalid dates", () => {
  const year = new Date().getFullYear() + 1;
  const model = getUsageExperience({
    tier: "MAX",
    weekly: { percent_used: 100, resets_at: new Date(year, 0, 2, 12) },
  });
  expect(usagePresentation(model, undefined, "zh-CN").title).toContain(
    String(year),
  );
  const invalid = { ...model, resetsAt: "invalid", trialEndsAt: "invalid" };
  expect(usagePresentation(invalid, undefined, "zh-CN").title).toBe(
    "额度刷新后即可继续使用",
  );
});

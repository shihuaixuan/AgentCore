import { describe, expect, test } from "vitest";
import { getExpertDisplayTitle, getExpertRoleLabel } from "./expert-role-label";

test("does not use the legacy name when no profession is known", () => {
  const legacy = { name: "凯西", jobTitle: "  ", role: null };
  expect(getExpertDisplayTitle(legacy, "zh-CN")).toBe("AI 专家");
});

test("localizes the built-in QA role but preserves an explicit custom title", () => {
  const expert = { name: "Casey", role: "Code Review & QA" };
  expect(getExpertDisplayTitle(expert, "zh-CN")).toBe("质量保障工程师");
  expect(
    getExpertDisplayTitle({ ...expert, jobTitle: "  测试架构师  " }, "zh-CN"),
  ).toBe("测试架构师");
});

describe("getExpertRoleLabel", () => {
  test("shortens long roster roles", () => {
    expect(getExpertRoleLabel("Social & Content Repurposing")).toBe(
      "Social Media Manager",
    );
    expect(getExpertRoleLabel("Market & Competitor Intelligence")).toBe(
      "Market Research Analyst",
    );
  });

  test("keeps other roles unchanged", () => {
    expect(getExpertRoleLabel("My custom role")).toBe("My custom role");
    expect(getExpertRoleLabel("constructor", "zh-CN")).toBe("constructor");
    expect(getExpertRoleLabel("__proto__")).toBe("__proto__");
  });

  test("localizes built-in roles without translating custom job titles", () => {
    expect(getExpertRoleLabel("Social & Content Repurposing", "zh-CN")).toBe(
      "社交媒体经理",
    );
    expect(getExpertRoleLabel("Application Security Engineer", "zh-CN")).toBe(
      "应用安全工程师",
    );
    expect(getExpertRoleLabel("My custom role", "zh-CN")).toBe(
      "My custom role",
    );
  });
});

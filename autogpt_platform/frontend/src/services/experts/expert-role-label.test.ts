import { describe, expect, test } from "vitest";
import { getExpertRoleLabel } from "./expert-role-label";

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

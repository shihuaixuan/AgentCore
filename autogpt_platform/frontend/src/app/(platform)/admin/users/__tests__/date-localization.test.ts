import { describe, expect, test } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatEnds,
  formatMonth,
  formatTimeUntil,
  getErrorMessage,
} from "../helpers";

const now = new Date(2026, 2, 11, 15, 4);
const date = new Date(2026, 2, 12, 15, 4);

describe("admin user date localization", () => {
  test("localizes dates, months and expiration summaries in Chinese", () => {
    expect(formatDate(date, "zh-CN")).toBe("2026年3月12日");
    expect(formatDateTime(date, "zh-CN")).toBe("2026年3月12日 15:04");
    expect(formatMonth(date, "zh-CN")).toBe("2026年3月");
    expect(formatTimeUntil(date, now, "zh-CN")).toBe("明天");
    expect(formatEnds(date, now, "zh-CN")).toBe("2026年3月12日 15:04 (明天)");
    expect(formatEnds(null, now, "zh-CN")).toBe("永久");
  });

  test("preserves English formatting and the existing now argument by default", () => {
    expect(formatDate(date)).toBe("12 Mar 2026");
    expect(formatDateTime(date)).toBe("12 Mar 2026, 15:04");
    expect(formatMonth(date)).toBe("Mar 2026");
    expect(formatTimeUntil(date, now)).toBe("tomorrow");
    expect(formatEnds(date, now)).toBe("12 Mar 2026, 15:04 (tomorrow)");
    expect(formatEnds(null, now)).toBe("Permanent");
  });

  test("localizes only the unknown error fallback, preserving server messages", () => {
    expect(getErrorMessage(null, "zh-CN")).toBe("出了点问题。");
    expect(getErrorMessage(null)).toBe("Something went wrong.");
    expect(getErrorMessage(new Error("Original API message"), "zh-CN")).toBe(
      "Original API message",
    );
  });
});

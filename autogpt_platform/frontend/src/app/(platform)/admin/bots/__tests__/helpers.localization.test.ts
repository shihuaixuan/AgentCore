import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDay, PLATFORM_OPTIONS } from "../components/helpers";

const DATE = new Date(2026, 2, 12, 12);
const nativeDateFormat = Date.prototype.toLocaleDateString;

beforeEach(() => {
  vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (
    this: Date,
    locales,
    options,
  ) {
    return nativeDateFormat.call(this, locales ?? "en-US", options);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bot analytics date localization", () => {
  it("formats chart days in Chinese independently of the system locale", () => {
    expect(formatDay(DATE, "zh-CN")).toBe("3月12日");
    expect(formatDay(DATE.toISOString(), "zh-CN")).toBe("3月12日");
  });

  it("formats roster dates in Chinese independently of the system locale", () => {
    expect(formatDate(DATE, "zh-CN")).toBe("2026年3月12日");
    expect(formatDate(DATE.toISOString(), "zh-CN")).toBe("2026年3月12日");
  });

  it("preserves English output for existing calls in an English environment", () => {
    expect(formatDay(DATE)).toBe("Mar 12");
    expect(formatDate(DATE)).toBe("Mar 12, 2026");
  });

  it("keeps missing roster dates empty in either locale", () => {
    expect(formatDate(null, "zh-CN")).toBe("—");
    expect(formatDate(undefined, "zh-CN")).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("preserves platform identifiers and brand names", () => {
    expect(PLATFORM_OPTIONS.slice(1)).toEqual([
      { value: "DISCORD", label: "Discord" },
      { value: "SLACK", label: "Slack" },
      { value: "TELEGRAM", label: "Telegram" },
      { value: "TEAMS", label: "Microsoft Teams" },
    ]);
  });
});

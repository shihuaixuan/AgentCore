import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatBriefingDate,
  getSafeLink,
  getSubtitleParts,
  isInternalLink,
} from "./helpers";

describe("formatBriefingDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels today's briefing as this morning", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T09:00:00Z"));

    expect(formatBriefingDate("2026-08-07")).toBe("This morning");
  });

  it("does not shift a date-only string a day back", () => {
    // The API sends "2026-08-07" with no time part, so the client's date
    // transformer leaves it a string. `new Date(...)` would read it as UTC
    // midnight — i.e. Aug 6 in the evening for anyone west of UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));

    expect(formatBriefingDate("2026-08-07")).toBe("August 7");
  });

  it("accepts an already-parsed Date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));

    expect(formatBriefingDate(new Date(2026, 7, 7, 9, 0))).toBe("August 7");
  });

  it("localizes the date without shifting date-only strings", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 12));
    expect(formatBriefingDate("2026-08-07", "zh-CN")).toBe("8月7日");
    expect(formatBriefingDate("2026-08-09", "zh-CN")).toBe("今天早上");
  });
});

describe("isInternalLink", () => {
  it("accepts an app-relative path", () => {
    expect(isInternalLink("/library/agents/lib-1")).toBe(true);
  });

  it.each(["https://evil.example", "javascript:alert(1)", "//evil.example"])(
    "rejects %s",
    (link) => {
      expect(isInternalLink(link)).toBe(false);
    },
  );
});

describe("getSafeLink", () => {
  it("passes an app-relative path through", () => {
    expect(getSafeLink("/library/agents/lib-1")).toBe("/library/agents/lib-1");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["absolute", "https://evil.example"],
    ["protocol-relative", "//evil.example"],
    ["javascript", "javascript:alert(1)"],
  ])("returns null for %s", (_label, link) => {
    expect(getSafeLink(link)).toBeNull();
  });
});

describe("getSubtitleParts", () => {
  it("attributes a summary to its expert", () => {
    expect(getSubtitleParts("Found 3 leads", "Sales Development Rep")).toEqual({
      attribution: "Sales Development Rep",
      text: "Found 3 leads",
    });
  });

  it("uses the expert as the subtitle rather than a prefix to itself", () => {
    expect(getSubtitleParts(null, "Sales Development Rep")).toEqual({
      attribution: null,
      text: "Sales Development Rep",
    });
  });

  it("drops attribution when the run has no expert", () => {
    expect(getSubtitleParts("Found 3 leads", null)).toEqual({
      attribution: null,
      text: "Found 3 leads",
    });
  });
});

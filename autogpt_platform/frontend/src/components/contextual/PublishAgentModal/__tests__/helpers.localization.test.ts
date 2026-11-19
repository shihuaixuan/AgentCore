import { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatSubmissionDate, getSubmissionMeta } from "../helpers";

const DATE = new Date(2026, 2, 12, 12);
const CATEGORY = "GitHub / Marketing";
const nativeDateFormat = Date.prototype.toLocaleDateString;

function chinese(_english: string, translated: string) {
  return translated;
}

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(DATE.getTime() + 86_400_000);
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

describe("submission metadata date localization", () => {
  it("formats Chinese absolute dates independently of the system locale", () => {
    expect(formatSubmissionDate(DATE, "zh-CN")).toBe("2026年3月12日");
    expect(formatSubmissionDate(DATE.toISOString(), "zh-CN")).toBe(
      "2026年3月12日",
    );
  });

  it("preserves English formatting for an existing call in an English environment", () => {
    expect(formatSubmissionDate(DATE)).toBe("Mar 12, 2026");
  });

  it.each([null, undefined, "not-a-date"])(
    "keeps an empty or invalid date %s absent in either locale",
    (value) => {
      expect(formatSubmissionDate(value, "zh-CN")).toBeNull();
      expect(formatSubmissionDate(value)).toBeNull();
    },
  );

  it.each([
    { status: SubmissionStatus.APPROVED, label: "上线时间" },
    { status: SubmissionStatus.REJECTED, label: "审核时间" },
    { status: SubmissionStatus.PENDING, label: "提交时间" },
  ])(
    "localizes the absolute date title for $status while preserving raw category data",
    ({ status, label }) => {
      const items = getSubmissionMeta(
        {
          status,
          version: 4,
          category: CATEGORY,
          submittedAt: DATE,
          reviewedAt: DATE,
          runCount: undefined,
        },
        chinese,
        "zh-CN",
      );

      expect(items).toContainEqual({
        label,
        value: "昨天",
        title: "2026年3月12日",
      });
      expect(items).toContainEqual({ label: "分类", value: CATEGORY });
      expect(items).toContainEqual({ label: "版本", value: "v4" });
    },
  );

  it("retains English metadata and raw categories when no translation or locale is supplied", () => {
    const items = getSubmissionMeta({
      status: SubmissionStatus.PENDING,
      version: 4,
      category: CATEGORY,
      submittedAt: DATE,
      reviewedAt: undefined,
      runCount: undefined,
    });

    expect(items).toContainEqual({
      label: "Submitted",
      value: "yesterday",
      title: "Mar 12, 2026",
    });
    expect(items).toContainEqual({ label: "Category", value: CATEGORY });
    expect(items).toContainEqual({ label: "Version", value: "v4" });
  });
});

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { DateInput } from "./DateInput";

const originalToLocaleDateString = Date.prototype.toLocaleDateString;

beforeEach(() => {
  vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (
    this: Date,
    locales,
    options,
  ) {
    return originalToLocaleDateString.call(this, locales ?? "en-US", options);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("shows the Chinese default date placeholder", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <DateInput />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "选择日期" })).toBeDefined();
});

test("formats the selected date in Chinese when the system default is English", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <DateInput value="2026-11-18" />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "2026年11月18日" })).toBeDefined();
});

test.each(["zh-CN", "en"] as const)(
  "preserves a custom date placeholder in %s",
  (locale) => {
    render(
      <LanguageProvider initialLocale={locale}>
        <DateInput placeholder="Original date hint" />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Original date hint" }),
    ).toBeDefined();
  },
);

test("preserves the English placeholder and selected date", () => {
  const { rerender } = render(
    <LanguageProvider initialLocale="en">
      <DateInput />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "Pick a date" })).toBeDefined();

  rerender(
    <LanguageProvider initialLocale="en">
      <DateInput value="2026-11-18" />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "Nov 18, 2026" })).toBeDefined();
});

test("keeps the English fallback without a language provider", () => {
  const { rerender } = render(<DateInput />);

  expect(screen.getByRole("button", { name: "Pick a date" })).toBeDefined();

  rerender(<DateInput value="2026-11-18" />);

  expect(screen.getByRole("button", { name: "Nov 18, 2026" })).toBeDefined();
});

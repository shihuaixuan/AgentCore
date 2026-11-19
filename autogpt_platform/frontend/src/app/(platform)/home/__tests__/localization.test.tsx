import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { HeldPassageQuote } from "../components/NeedsYou/components/HeldPassageQuote";
import { UpcomingRow } from "../components/NowNext/components/UpcomingRow";

function Example() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <HeldPassageQuote passage="Keep this original file content" />
      <UpcomingRow
        item={{
          id: "scheduled-workflow",
          kind: "agent",
          title: "My Original Workflow",
          next_run_time: new Date("2099-01-01T00:00:00Z"),
        }}
      />
    </>
  );
}

test("translates home labels without changing quoted contents or workflow titles", () => {
  render(
    <LanguageProvider>
      <Example />
    </LanguageProvider>,
  );
  expect(screen.getByRole("blockquote", { name: "引用内容" }).textContent).toBe(
    "Keep this original file content",
  );
  expect(screen.getByText("My Original Workflow")).toBeDefined();
  expect(screen.getByText("工作流")).toBeDefined();
  expect(screen.getByText("计划任务", { exact: false })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("blockquote", { name: "What it says" }).textContent,
  ).toBe("Keep this original file content");
  expect(screen.getByText("workflow")).toBeDefined();
  expect(screen.getByText("My Original Workflow")).toBeDefined();
});

test("keeps the English fallback outside the language provider", () => {
  render(<HeldPassageQuote passage="Original quote" />);
  expect(
    screen.getByRole("blockquote", { name: "What it says" }).textContent,
  ).toBe("Original quote");
});

test("uses a localized role for a scheduled expert without a job title", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <UpcomingRow
        item={{
          id: "schedule",
          kind: "agent",
          title: "Meeting prep",
          expert: { id: "ada", name: "Ada", role: "Ops", avatar_url: null },
          next_run_time: new Date("2099-01-01T00:00:00Z"),
        }}
      />
    </LanguageProvider>,
  );

  expect(screen.getByText("行政助理")).toBeDefined();
  expect(screen.queryByText(/Ada/)).toBeNull();
});

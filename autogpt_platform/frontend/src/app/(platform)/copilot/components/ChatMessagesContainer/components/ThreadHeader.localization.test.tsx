import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ThreadHeader } from "./ThreadHeader";

test("localizes the untitled conversation header in Chinese", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ThreadHeader />
    </LanguageProvider>,
  );

  expect(screen.getByText("对话")).toBeDefined();
  expect(screen.queryByText("Otto")).toBeNull();
});

test("preserves a conversation's title in Chinese", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ThreadHeader title="Campaign planning" />
    </LanguageProvider>,
  );

  expect(screen.getByText("Campaign planning")).toBeDefined();
});

test("uses the English fallback without a provider", () => {
  render(<ThreadHeader />);

  expect(screen.getByText("Conversation")).toBeDefined();
});

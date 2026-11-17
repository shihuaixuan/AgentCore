import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AutopilotAboutSection } from "../components/AutopilotAboutSection";

describe("Otto 中文资料", () => {
  test("显示中文介绍、职责和边界", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <AutopilotAboutSection />
      </LanguageProvider>,
    );
    expect(screen.getByText("身份")).toBeDefined();
    expect(screen.getByText(/Otto 是团队中的通才/)).toBeDefined();
    expect(screen.getByText("边界")).toBeDefined();
  });
});

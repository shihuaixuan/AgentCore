import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import MicrosoftSetupPage from "../page";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { fireEvent } from "@testing-library/react";

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

describe("Microsoft setup page", () => {
  it("shows localized service purposes and keeps Microsoft brands and destination URLs", () => {
    render(
      <LanguageProvider>
        <SwitchLanguage />
        <MicrosoftSetupPage />
      </LanguageProvider>,
    );
    expect(
      screen.getByText("允许 通用办公助手 读取、起草和发送你的电子邮件"),
    ).toBeDefined();
    expect(
      screen.getByText("允许 通用办公助手 打开、创建和编辑你的 OneDrive 文件"),
    ).toBeDefined();
    expect(screen.getByText("Microsoft 365 Copilot")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Microsoft 指南" }).getAttribute("href"),
    ).toBe(
      "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent",
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.getByText("Lets 通用办公助手 read, draft and send your email"),
    ).toBeDefined();
  });

  it("says what AutoGPT asks for and how an admin approves it in either sign-in mode", () => {
    render(<MicrosoftSetupPage />);

    expect(
      screen.getByText("Lets 通用办公助手 read, draft and send your email"),
    ).toBeTruthy();
    const step = screen
      .getAllByRole("listitem")
      .find((item) =>
        item.textContent?.includes("Approve for my whole organization"),
      );
    // The button exists only with browser sign-in on; sign-in codes need
    // Microsoft's own admin consent instead.
    expect(step?.textContent).toContain("sign-in codes");
    expect(
      screen
        .getByRole("link", { name: "Microsoft's guide" })
        .getAttribute("href"),
    ).toBe(
      "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent",
    );
  });
});

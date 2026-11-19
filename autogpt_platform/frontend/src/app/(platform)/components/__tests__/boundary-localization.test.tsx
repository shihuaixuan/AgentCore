import ErrorPage from "@/app/error";
import Unauthorized from "@/app/(platform)/unauthorized/page";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("boundary localization", () => {
  it("localizes the error actions, preserves reset and switches languages", () => {
    const reset = vi.fn();
    render(
      <LanguageProvider>
        <SwitchLanguage />
        <ErrorPage error={new Error("raw-error-id")} reset={reset} />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "哎呀，出错了！" }),
    ).toBeDefined();
    expect(
      screen.getByText(
        "很抱歉，发生了意外错误。请稍后重试；如果问题持续，请联系支持团队。",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "返回首页" }).getAttribute("href"),
    ).toBe("/");
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(reset).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.getByRole("heading", { name: "Oops, something went wrong!" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  it("renders English when the error boundary has no LanguageProvider", () => {
    render(<ErrorPage error={new Error("raw-error-id")} reset={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Oops, something went wrong!" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Go to Homepage" }).getAttribute("href"),
    ).toBe("/");
  });

  it("localizes unauthorized access and retains an English fallback", () => {
    const page = render(
      <LanguageProvider>
        <Unauthorized />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "无权访问" })).toBeDefined();
    expect(screen.getByText("你没有权限查看此页面。")).toBeDefined();
    page.unmount();
    render(<Unauthorized />);
    expect(
      screen.getByRole("heading", { name: "Unauthorized Access" }),
    ).toBeDefined();
    expect(
      screen.getByText("You do not have permission to view this page."),
    ).toBeDefined();
  });
});

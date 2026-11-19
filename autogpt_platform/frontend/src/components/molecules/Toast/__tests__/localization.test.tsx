import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { toast as sonnerToast } from "sonner";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { Toaster } from "../toaster";
import { useToastOnFail } from "../use-toast";

function FailedAction({ error }: { error: Error }) {
  const { t } = useTranslation();
  const onFail = useToastOnFail();
  return (
    <button onClick={() => onFail(t("request top-up", "申请充值"))(error)}>
      Trigger
    </button>
  );
}

describe("localized action failure notifications", () => {
  afterEach(() => sonnerToast.dismiss());

  it("uses Chinese for the failure title and fallback without changing raw errors", async () => {
    const view = render(
      <LanguageProvider initialLocale="zh-CN">
        <FailedAction error={new Error()} />
        <Toaster />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    expect(await screen.findByText("无法申请充值")).toBeDefined();
    expect(await screen.findByText("发生错误，请重试")).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: "关闭通知" }).length,
    ).toBeGreaterThan(0);

    view.rerender(
      <LanguageProvider initialLocale="zh-CN">
        <FailedAction error={new Error("Original provider error")} />
        <Toaster />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    expect(await screen.findByText("Original provider error")).toBeDefined();
  });

  it("keeps the handler stable across language changes while using the latest translation", async () => {
    const dependencyChanged = vi.fn();
    function Probe() {
      const { locale, setLocale, t } = useTranslation();
      const onFail = useToastOnFail();
      useEffect(() => {
        dependencyChanged();
      }, [onFail]);
      return (
        <>
          <button onClick={() => setLocale("zh-CN")}>{locale}</button>
          <button
            onClick={() => onFail(t("request top-up", "申请充值"))(new Error())}
          >
            Fail
          </button>
        </>
      );
    }
    render(
      <LanguageProvider initialLocale="en">
        <Probe />
        <Toaster />
      </LanguageProvider>,
    );
    expect(dependencyChanged).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "en" }));
    expect(dependencyChanged).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(await screen.findByText("无法申请充值")).toBeDefined();
  });
});

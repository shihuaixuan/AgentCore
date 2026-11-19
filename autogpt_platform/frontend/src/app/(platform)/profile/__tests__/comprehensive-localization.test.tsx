import { afterEach, describe, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AgentTable } from "../(user)/dashboard/components/AgentTable/AgentTable";
import { EmailForm } from "../(user)/settings/components/SettingsForm/components/EmailForm/EmailForm";
import { RefundModal } from "../(user)/credits/RefundModal";
import { PendingChangeBanner } from "../(user)/credits/components/SubscriptionTierSection/components/PendingChangeBanner/PendingChangeBanner";
import type { User } from "@/lib/auth/types";

const toastSpy = vi.hoisted(() => vi.fn());
vi.mock("@/components/molecules/Toast/use-toast", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/molecules/Toast/use-toast")
  >()),
  useToast: () => ({ toast: toastSpy }),
}));

const user = {
  id: "user-1",
  email: "jane@example.com",
  email_verified: true,
} as User;

afterEach(() => {
  vi.unstubAllGlobals();
  toastSpy.mockReset();
});

describe("legacy profile comprehensive Chinese localization", () => {
  test("translates dashboard columns and empty state", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <AgentTable
          storeAgentSubmissions={[]}
          onViewSubmission={vi.fn()}
          onDeleteSubmission={vi.fn()}
          onEditSubmission={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("工作流信息")).toBeDefined();
    expect(screen.getByText("提交日期")).toBeDefined();
    expect(
      screen.getByText("暂无工作流。创建你的第一个工作流即可开始！"),
    ).toBeDefined();
  });

  test("translates refund validation and preserves the reason field value", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <RefundModal
          isOpen
          onClose={vi.fn()}
          transactions={[]}
          formatCredits={String}
          refundCredits={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "申请退款" })).toBeDefined();
    expect(screen.getByText("未找到符合退款条件的交易。")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "退款原因" }), {
      target: { value: "My original reason" },
    });
    fireEvent.click(screen.getByRole("button", { name: "申请退款" }));
    expect(screen.getByText("请选择要退款的交易")).toBeDefined();
    expect(
      (screen.getByRole("textbox", { name: "退款原因" }) as HTMLTextAreaElement)
        .value,
    ).toBe("My original reason");
  });

  test("translates scheduled changes and keeps the current tier brand", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <PendingChangeBanner
          currentTier="PRO"
          pendingTier="NO_TIER"
          pendingEffectiveAt="2026-12-01T00:00:00Z"
          onKeepCurrent={vi.fn()}
          isBusy={false}
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("计划于");
    expect(screen.getByRole("status").textContent).toContain("取消订阅");
    expect(screen.getByRole("button", { name: "保留 Pro" })).toBeDefined();
  });

  test("translates email controls and confirmation toast without changing the request", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchSpy);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <EmailForm user={user} />
      </LanguageProvider>,
    );
    expect(screen.getByText("安全与访问")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "电子邮箱" }), {
      target: { value: "updated@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新邮箱" }));
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "确认新邮箱",
          description:
            "我们已向当前邮箱发送确认链接。点击链接后，邮箱才会更改。",
        }),
      ),
    );
    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "updated@example.com" }),
    });
  });

  test("translates email validation without sending invalid values", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <EmailForm user={user} />
      </LanguageProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "电子邮箱" }), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新邮箱" }));
    expect(await screen.findByText("请输入有效的电子邮箱地址")).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

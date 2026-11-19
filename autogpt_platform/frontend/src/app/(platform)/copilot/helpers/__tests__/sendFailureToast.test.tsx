import { toast } from "@/components/molecules/Toast/use-toast";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SentNowError } from "../../components/SendAtReset/helpers";
import { ReportedSendError } from "../reportedSendError";
import { toastSendFailure } from "../sendFailureToast";
import { CopilotAuthError } from "../../helpers";

vi.mock("@/components/molecules/Toast/use-toast", () => ({ toast: vi.fn() }));

const ARGS = {
  title: "Couldn't send message",
  recovery: "your message is back in the composer",
};

// Send at reset sends at once when the budget turns out to be back, and
// reports that send's failure under its own title.
describe("a send Send at reset made at once", () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
  });

  it("adds no toast to a refusal the chat already showed", () => {
    const shown = new ReportedSendError("The plan dialog is open");

    toastSendFailure({ ...ARGS, error: new SentNowError(shown) });

    expect(toast).not.toHaveBeenCalled();
  });

  it("offers plans when the account needs one", () => {
    const paywall = new ApiError("Payment required", 402, {});

    toastSendFailure({ ...ARGS, error: new SentNowError(paywall) });

    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "Sending needs an active plan",
    });
  });

  it("localizes the app-owned authentication error in send recovery", () => {
    toastSendFailure({
      title: "无法发送消息",
      error: new CopilotAuthError(),
      recovery: "你的消息已返回输入框",
      locale: "zh-CN",
    });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "身份验证失败，请重新登录 — 你的消息已返回输入框。",
      }),
    );
  });

  it("localizes plan failures when a Chinese locale is provided", () => {
    toastSendFailure({
      title: "发送失败",
      recovery: "你的消息已返回输入框",
      error: new ApiError("Payment required", 402, {}),
      locale: "zh-CN",
    });

    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "发送消息需要有效套餐",
    });
  });

  it("localizes fallback recovery without rewriting raw server errors", () => {
    toastSendFailure({
      title: "发送失败",
      recovery: "你的消息已返回输入框",
      error: null,
      locale: "zh-CN",
    });
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      description: "你的消息已返回输入框。请重试。",
    });

    toastSendFailure({
      title: "发送失败",
      recovery: "你的消息已返回输入框",
      error: new Error("Original server error"),
      locale: "zh-CN",
    });
    expect(vi.mocked(toast).mock.calls[1][0]).toMatchObject({
      description: "Original server error — 你的消息已返回输入框。",
    });
  });
});

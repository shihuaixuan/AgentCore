import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { expect, it, vi } from "vitest";
import { QueueHeader } from "../components/QueueHeader";
import { QueueFooter } from "../components/QueueFooter";
import { ApprovalCard } from "../components/ApprovalCard/ApprovalCard";
import { modeLine, reasonLine, toApprovalItem } from "../helpers";
import { heldReview } from "./fixtures";
import userEvent from "@testing-library/user-event";
import { approvalHeadline } from "../approval-copy";

it("localizes approval controls and modes without changing the reviewed action", async () => {
  const user = userEvent.setup();
  const item = toApprovalItem(
    heldReview({
      id: "zh",
      tool: "create_folder",
      headline: { ask: "Create folder", object: "My English folder" },
      chatRules: ["allow", "judge"],
    }),
  );
  render(
    <LanguageProvider>
      <QueueHeader
        count={2}
        mode="ask_first"
        approveAll={{ count: 2, busy: false, onClick: vi.fn() }}
        onReviewAll={vi.fn()}
        onShow={null}
      />
      <ApprovalCard
        item={item}
        status="idle"
        failed
        expertName="Alex"
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("等待你处理")).toBeDefined();
  expect(screen.getByText("先询问")).toBeDefined();
  expect(screen.getByRole("button", { name: "批准这两项" })).toBeDefined();
  expect(screen.getByRole("button", { name: "审核全部" })).toBeDefined();
  expect(screen.getByText("My English folder")).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "创建文件夹 My English folder" }),
  ).toBeDefined();
  expect(
    screen.getByText("发送答复失败，未执行任何操作。请重试。"),
  ).toBeDefined();
  await user.click(screen.getByRole("button", { name: "更多批准方式" }));
  expect(await screen.findByText("适用范围")).toBeDefined();
  expect(screen.getByText("当前对话")).toBeDefined();
});

it("localizes rejection confirmation and keeps the action callbacks intact", () => {
  const confirm = vi.fn();
  render(
    <LanguageProvider>
      <QueueFooter
        rejectAll={{
          count: 3,
          confirming: true,
          onAsk: vi.fn(),
          onCancel: vi.fn(),
          onConfirm: confirm,
        }}
        busy={false}
        onContinue={null}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("alert").textContent).toBe(
    "拒绝全部 3 项？将告知 通用办公助手 这些操作均未执行。",
  );
  fireEvent.click(screen.getByRole("button", { name: "全部拒绝" }));
  expect(confirm).toHaveBeenCalledOnce();
});

it("localizes generated reason templates while retaining external reasons", () => {
  const item = toApprovalItem(
    heldReview({
      id: "reason",
      tool: "run_block",
      reason: "Custom policy text",
      reasonKind: "supervisor",
    }),
  );
  expect(reasonLine(item, "zh-CN")).toBe(
    "无法确认此操作是否安全：Custom policy text",
  );
  expect(modeLine("ask_first", "zh-CN")).toContain("先询问");
  expect(modeLine("ask_first")).toContain("Ask First");
});

it("only translates known approval headlines, not arbitrary external instructions", () => {
  expect(
    approvalHeadline("Create library folder", "create_folder", "zh-CN"),
  ).toBe("创建资源库文件夹");
  expect(
    approvalHeadline("A custom English instruction", "create_folder", "zh-CN"),
  ).toBe("A custom English instruction");
  expect(approvalHeadline("Let Casey read", "web_fetch", "zh-CN")).toBe(
    "允许 Casey 读取",
  );
});

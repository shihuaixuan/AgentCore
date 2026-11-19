import { expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { getPostV2ProcessReviewActionMockHandler200 } from "@/app/api/__generated__/endpoints/executions/executions.msw";
import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { PendingReviewsList } from "../PendingReviewsList";
import { waitingOnLine } from "../helpers";
import { SpendRing } from "../components/SpendApprovalCard/components/SpendRing";

const { toastSpy } = vi.hoisted(() => ({ toastSpy: vi.fn() }));
vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: toastSpy,
  useToast: () => ({ toast: toastSpy, dismiss: vi.fn() }),
}));

const review: PendingHumanReviewModel = {
  node_exec_id: "ne-1",
  node_id: "n-1",
  user_id: "u-1",
  graph_exec_id: "run-1",
  graph_id: "g-1",
  graph_version: 1,
  payload: { subject: "Original email" },
  instructions: "Original instruction",
  action: "Original action",
  agent_name: "Original workflow",
  editable: true,
  status: "WAITING",
  created_at: new Date("2026-11-01T00:00:00Z"),
};

test("localizes grouped review copy and success counts without translating actions or payloads", async () => {
  toastSpy.mockClear();
  server.use(
    getPostV2ProcessReviewActionMockHandler200({
      approved_count: 2,
      rejected_count: 0,
      failed_count: 0,
    }),
  );
  render(
    <LanguageProvider>
      <PendingReviewsList
        reviews={[review, { ...review, node_exec_id: "ne-2" }]}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("位于工作流“Original workflow”中")).toBeDefined();
  expect(screen.getByText("2 项审核")).toBeDefined();
  expect(
    screen.getByText(
      "此工作流已暂停，等待你批准下方步骤。请检查它将执行的操作，必要时进行修改。",
    ),
  ).toBeDefined();
  expect(screen.getByText("Original action")).toBeDefined();
  expect(
    (screen.getAllByRole("textbox")[0] as HTMLTextAreaElement).value,
  ).toContain("Original email");
  expect(screen.getByRole("button", { name: "拒绝 2 项审核" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "批准 2 项审核" }));
  await waitFor(() =>
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: "已批准 2 项，已拒绝 0 项" }),
    ),
  );
});

test("localizes default empty copy but preserves a caller-supplied empty message", () => {
  const { rerender } = render(
    <LanguageProvider>
      <PendingReviewsList reviews={[]} />
    </LanguageProvider>,
  );
  expect(screen.getByText("暂无待审核项")).toBeDefined();
  rerender(
    <LanguageProvider>
      <PendingReviewsList reviews={[]} emptyMessage="Raw empty message" />
    </LanguageProvider>,
  );
  expect(screen.getByText("Raw empty message")).toBeDefined();
});

test("localizes an unknown expert and keeps separate legacy actors distinct", () => {
  expect(
    waitingOnLine(
      [["copilot-node-gate-1", [{ ...review, expert_name: "Ana" }]]],
      "zh-CN",
    ),
  ).toBe("AI 专家 正在等待你批准下方操作。");
  expect(
    waitingOnLine(
      [
        [
          "copilot-node-gate-1",
          [
            { ...review, expert_name: "Ana" },
            { ...review, expert_name: "Ben" },
          ],
        ],
      ],
      "zh-CN",
    ),
  ).toBe("你的团队正在等待你批准下方操作。");
});

test("localizes spend accessibility without translating the child", () => {
  render(
    <LanguageProvider>
      <SpendRing spent={30} threshold={100}>
        Raw child
      </SpendRing>
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("img", { name: "已使用 30 积分，额度为 100 积分" }),
  ).toBeDefined();
  expect(screen.getByText("Raw child")).toBeDefined();
});

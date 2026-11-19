import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { NeedsAttentionRow } from "../components/NeedsAttentionRow";

const review: PendingHumanReviewModel = {
  node_exec_id: "ne-1",
  node_id: "n-1",
  user_id: "u-1",
  graph_exec_id: "run-1",
  graph_id: "g-1",
  graph_version: 1,
  payload: { to: "original@example.com" },
  instructions: "Approve original email",
  editable: true,
  status: "WAITING",
  expert_name: "Ana",
  agent_name: "Original workflow",
  created_at: new Date("2026-11-01T00:00:00Z"),
};

test("localizes review action names and decline confirmation while preserving the review", () => {
  const onApprove = vi.fn();
  const onDecline = vi.fn();
  render(
    <LanguageProvider>
      <NeedsAttentionRow
        review={review}
        isProcessing={false}
        onApprove={onApprove}
        onDecline={onDecline}
      />
    </LanguageProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "批准：Approve original email" }),
  );
  expect(onApprove).toHaveBeenCalledWith(review);
  fireEvent.click(
    screen.getByRole("button", { name: "拒绝：Approve original email" }),
  );
  expect(onDecline).not.toHaveBeenCalled();
  expect(
    screen.getByText("再次点击以拒绝：Approve original email"),
  ).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: "确认拒绝：Approve original email" }),
  );
  expect(onDecline).toHaveBeenCalledWith(review);
  expect(screen.getByText("Ana · Original workflow")).toBeDefined();
});

test("localizes only the app-owned review title fallback", () => {
  render(
    <LanguageProvider>
      <NeedsAttentionRow
        review={{ ...review, instructions: null, agent_name: null }}
        isProcessing={false}
        onApprove={vi.fn()}
        onDecline={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "批准：需要审核" })).toBeDefined();
});

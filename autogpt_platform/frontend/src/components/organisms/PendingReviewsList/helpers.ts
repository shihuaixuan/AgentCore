import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import type { Locale } from "@/lib/i18n/locale";

// Copilot action-gate approvals bind exact arguments; auto-approve cannot apply.
export const COPILOT_GATE_NODE_PREFIX = "copilot-node-gate-";

export function isGateReview(nodeId: string | null | undefined) {
  return !!nodeId?.startsWith(COPILOT_GATE_NODE_PREFIX);
}

// A chat's reviews wait on the expert whose chat raised them, on Otto, or on
// the team when they came from more than one; only a workflow run is paused by
// its review.
export function waitingOnLine(
  groups: [string, PendingHumanReviewModel[]][],
  locale: Locale = "en",
) {
  const inChat = groups.every(
    ([nodeId, nodeReviews]) =>
      isGateReview(nodeId) || nodeReviews.every((r) => !r.graph_exec_id),
  );
  if (!inChat)
    return locale === "zh-CN"
      ? "此工作流已暂停，等待你批准下方步骤。请检查它将执行的操作，必要时进行修改。"
      : "This workflow is paused until you approve the step below. Check what it will do, and edit it if needed.";
  const experts = new Set(
    groups.flatMap(([, nodeReviews]) =>
      nodeReviews.map((r) => r.expert_name ?? null),
    ),
  );
  const [expert] = experts;
  if (locale === "zh-CN") {
    if (experts.size > 1) return "你的团队正在等待你批准下方操作。";
    return `${expert ?? AUTOPILOT_NAME} 正在等待你批准下方操作。`;
  }
  const name = experts.size > 1 ? "Your team" : (expert ?? AUTOPILOT_NAME);
  return `${name} is waiting for your approval before the action below.`;
}

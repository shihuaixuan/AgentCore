import { capabilityTargetRow } from "./capabilityRow";
import type { ChainRow } from "./helpers";
import { asObject, str } from "./resultHelpers";

export const SUB_SESSION_RESULT_TOOL = "get_sub_session_result";

const START_TOOLS = new Set([
  "run_sub_session",
  "delegate_to_expert",
  "handoff_to_expert",
]);

export function subSessionTargetRow(row: ChainRow) {
  const target = capabilityTargetRow(row);
  if (asObject(target.input)?.connect === true) return null;
  return target.tool &&
    (START_TOOLS.has(target.tool) || target.tool === SUB_SESSION_RESULT_TOOL)
    ? target
    : null;
}

export function childSessionID(output: Record<string, unknown>) {
  const id = str(output, "sub_autopilot_session_id", "sub_session_id");
  if (id) return id;
  const legacyLink = str(output, "sub_autopilot_session_link");
  if (!legacyLink?.startsWith("/copilot?")) return null;
  return new URLSearchParams(legacyLink.slice("/copilot?".length)).get(
    "sessionId",
  );
}

export function isCompactSubSessionRow(row: ChainRow) {
  if (
    row.supersededSubSession ||
    row.requiresAction ||
    (row.held && row.held.state !== "approved")
  )
    return false;
  const target = subSessionTargetRow(row);
  if (!target) return false;
  const output = asObject(target.output);
  return output
    ? row.state === "done" &&
        !!str(output, "status") &&
        !!childSessionID(output)
    : !row.held &&
        row.output === undefined &&
        row.state === "running" &&
        target.tool !== SUB_SESSION_RESULT_TOOL;
}

export function isLiveSubSessionRow(row: ChainRow) {
  const target = subSessionTargetRow(row);
  if (!target) return false;
  if (target.output === undefined) {
    return row.state === "running" && target.tool !== SUB_SESSION_RESULT_TOOL;
  }
  const output = asObject(target.output);
  return (
    !!output &&
    ["running", "queued"].includes(str(output, "status")?.toLowerCase() ?? "")
  );
}

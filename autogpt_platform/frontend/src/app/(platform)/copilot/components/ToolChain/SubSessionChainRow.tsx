"use client";

import type { ChainRow } from "./helpers";
import { asObject, str } from "./resultHelpers";
import { RowIcon } from "./RowIcon";
import { SubSessionCard } from "./AgentCards";
import { SubSessionPendingCard } from "./SubSessionLive";

const SUB_SESSION_TOOLS = new Set([
  "run_sub_session",
  "delegate_to_expert",
  "handoff_to_expert",
  "get_sub_session_result",
]);

export function isSubSessionTool(tool: string | undefined): boolean {
  return !!tool && SUB_SESSION_TOOLS.has(tool);
}

export function isCompactSubSessionRow(row: ChainRow): boolean {
  if (row.supersededSubSession || row.held || !isSubSessionTool(row.tool)) {
    return false;
  }
  const output = asObject(row.output);
  if (output && str(output, "status")) return true;
  return (
    row.output === undefined &&
    row.state === "running" &&
    row.tool !== "get_sub_session_result"
  );
}

interface Props {
  row: ChainRow;
  isLast: boolean;
  readOnly?: boolean;
}

export function SubSessionChainRow({ row, isLast, readOnly = false }: Props) {
  const output = asObject(row.output);
  const showPending =
    !output && row.state === "running" && row.tool !== "get_sub_session_result";

  return (
    <div className="flex items-stretch gap-2.5">
      <div className="flex w-7 flex-col items-center">
        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-hover">
          <RowIcon row={row} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 origin-top animate-grow-line bg-surface-active motion-reduce:animate-none" />
        )}
      </div>
      <div className="min-w-0 flex-1 pb-3">
        {output ? (
          <SubSessionCard output={output} compact readOnly={readOnly} />
        ) : showPending ? (
          <SubSessionPendingCard
            input={row.input}
            minimal
            compact
            readOnly={readOnly}
          />
        ) : null}
      </div>
    </div>
  );
}

export function isLiveSubSessionRow(row: ChainRow): boolean {
  if (!isSubSessionTool(row.tool)) return false;
  if (row.output === undefined) {
    return row.state === "running" && row.tool !== "get_sub_session_result";
  }
  const output = asObject(row.output);
  const status = output && str(output, "status");
  return !!status && ["running", "queued"].includes(status.toLowerCase());
}

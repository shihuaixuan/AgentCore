import { ApiError } from "@/lib/autogpt-server-api/helpers";
import type { GraphValidationErrorResponse } from "@/lib/autogpt-server-api/types";
import { useNodeStore } from "../stores/nodeStore";

// A graph the backend refuses to save comes back as a structured validation
// error naming each node's bad fields, e.g. "Agent Output › Name: This field
// is required"; anything else is shown as it arrives.
export function describeSaveError(
  error: unknown,
  t: (english: string, chinese: string) => string = (english) => english,
) {
  if (isValidationError(error)) {
    return {
      title: t("Couldn't save your workflow", "无法保存工作流"),
      description: t(
        `${error.response.detail.message}. Fix the highlighted fields and save again.`,
        `${error.response.detail.message}。请修复高亮字段后重新保存。`,
      ),
      variant: "destructive" as const,
    };
  }
  return {
    title: t("Error saving workflow", "保存工作流时出错"),
    description:
      error instanceof Error
        ? error.message
        : t("An unexpected error occurred.", "发生意外错误。"),
    variant: "destructive" as const,
  };
}

// Like a refused run, the latest refusal replaces whatever was marked before.
export function markInvalidFields(error: unknown) {
  if (!isValidationError(error)) return;
  const { clearAllNodeErrors, setNodeErrorsForBackendId } =
    useNodeStore.getState();
  clearAllNodeErrors();
  Object.entries(error.response.detail.node_errors).forEach(
    ([nodeID, fieldErrors]) => setNodeErrorsForBackendId(nodeID, fieldErrors),
  );
}

function isValidationError(
  error: unknown,
): error is ApiError<GraphValidationErrorResponse> {
  return error instanceof ApiError && error.isGraphValidationError();
}

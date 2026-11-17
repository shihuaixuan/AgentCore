import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import Link from "next/link";
import React from "react";

type ValidationErrorDetail = {
  type: string;
  message?: string;
  node_errors?: Record<string, Record<string, string>>;
};

type AgentInfo = {
  graph_id: string;
  graph_version: number;
};

export function formatValidationError(
  error: any,
  agentInfo?: AgentInfo,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string | React.ReactNode {
  if (
    !(error instanceof ApiError) ||
    !error.isGraphValidationError() ||
    !error.response?.detail
  ) {
    return (
      error.message || t("An unexpected error occurred.", "发生意外错误。")
    );
  }

  const detail: ValidationErrorDetail = error.response.detail;

  // Format validation errors nicely
  if (detail.type === "validation_error" && detail.node_errors) {
    const nodeErrors = detail.node_errors;
    const errorItems: React.ReactNode[] = [];

    // Collect all field errors
    Object.entries(nodeErrors).forEach(([nodeId, fields]) => {
      if (fields && typeof fields === "object") {
        Object.entries(fields).forEach(([fieldName, fieldError]) => {
          errorItems.push(
            <div key={`${nodeId}-${fieldName}`} className="mt-1">
              <span className="font-medium">{fieldName}:</span>{" "}
              {String(fieldError)}
            </div>,
          );
        });
      }
    });

    if (errorItems.length > 0) {
      return (
        <div className="space-y-1">
          <div className="font-medium text-action-foreground">
            {detail.message || t("Validation failed", "校验失败")}
          </div>
          <div className="mt-2 space-y-1 text-caption">{errorItems}</div>
          {agentInfo && (
            <div className="mt-3 text-caption">
              {t(
                "Open the workflow in the builder and try running it there for more details.",
                "请在构建器中打开工作流并尝试运行，以查看详细信息。",
              )}{" "}
              <Link
                href={`/build?flowID=${agentInfo.graph_id}&flowVersion=${agentInfo.graph_version}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer underline hover:no-underline"
              >
                {t("Open in builder", "在构建器中打开")}
              </Link>
            </div>
          )}
        </div>
      );
    } else {
      return detail.message || t("Validation failed", "校验失败");
    }
  }

  return (
    detail.message ||
    error.message ||
    t("An unexpected error occurred.", "发生意外错误。")
  );
}

export function showExecutionErrorToast(
  toast: (options: {
    title: string;
    description: string | React.ReactNode;
    variant: "destructive";
    duration: number;
    dismissable: boolean;
  }) => void,
  error: any,
  agentInfo?: AgentInfo,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  const errorMessage = formatValidationError(error, agentInfo, t);

  toast({
    title: t("Failed to execute workflow", "运行工作流失败"),
    description: errorMessage,
    variant: "destructive",
    duration: 10000, // 10 seconds - long enough to read and close
    dismissable: true,
  });
}

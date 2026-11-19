"use client";

import type { ExecutionStartedResponse } from "@/app/api/__generated__/models/executionStartedResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { executionSharePath } from "@/lib/share/routes";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  ContentCard,
  ContentCardDescription,
  ContentCardSubtitle,
  ContentCardTitle,
  ContentGrid,
} from "../../../../components/ToolAccordion/AccordionContent";
import { useCopilotChatActions } from "../../../../components/CopilotChatActionsProvider/useCopilotChatActions";

interface Props {
  output: ExecutionStartedResponse;
  error?: string | null;
}

export function titleForStatus(
  status: string | undefined,
  t = (english: string, _chinese: string) => english,
): string {
  // Normalise whatever the backend sent (QUEUED/RUNNING/COMPLETED/FAILED/
  // STOPPED/TERMINATED/TIMED_OUT/INCOMPLETE/CANCELLED …). The card is
  // reused for both truly-just-queued runs and for sync-completed runs
  // (run_agent with wait_for_result) — "Execution started" is wrong for
  // the latter.
  const s = (status ?? "").toUpperCase();
  if (s === "COMPLETED") return t("Execution completed", "执行已完成");
  if (s === "FAILED") return t("Execution failed", "执行失败");
  if (s === "STOPPED" || s === "TERMINATED" || s === "CANCELLED")
    return t("Execution stopped", "执行已停止");
  if (s === "TIMED_OUT" || s === "INCOMPLETE")
    return t("Execution incomplete", "执行未完成");
  if (s === "RUNNING") return t("Execution running", "正在执行");
  if (s === "SCHEDULED") return t("Execution scheduled", "执行已安排");
  return t("Execution started", "执行已启动");
}

export function ExecutionStartedCard({ output, error }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  // In the builder panel the run_agent effect already drops the exec_id
  // onto the URL so the builder's in-place execution UI opens — the
  // "View Execution" button here would navigate the user away from the
  // page they're editing, so hide it.
  //
  // On the public share viewer, route the CTA to the linked execution's
  // own share page (``/share/{token}``) when a linked share exists.
  // If it doesn't (chat shared without opting in to share this run),
  // hide the button — the auth-gated /library URL is unreachable.
  const { chatSurface, getExecutionShareToken } = useCopilotChatActions();
  const linkedShareToken = getExecutionShareToken?.(output.execution_id);
  const hideViewExecution =
    chatSurface === "builder" || (chatSurface === "share" && !linkedShareToken);

  const href = linkedShareToken
    ? executionSharePath(linkedShareToken)
    : (output.library_agent_link ??
      `/library/agents/${output.graph_id}?activeTab=runs&activeItem=${output.execution_id}`);

  return (
    <ContentGrid>
      <ContentCard>
        <ContentCardTitle>{titleForStatus(output.status, t)}</ContentCardTitle>
        <ContentCardSubtitle>{output.execution_id}</ContentCardSubtitle>
        {output.message && (
          <ContentCardDescription>{output.message}</ContentCardDescription>
        )}
        {error && (
          <Text variant="small" tone="error" className="mt-2 break-words">
            {error}
          </Text>
        )}
        {!hideViewExecution && (
          <Button
            size="small"
            className="mt-3"
            onClick={() => router.push(href)}
          >
            {t("View Execution", "查看执行记录")}
          </Button>
        )}
      </ContentCard>
    </ContentGrid>
  );
}

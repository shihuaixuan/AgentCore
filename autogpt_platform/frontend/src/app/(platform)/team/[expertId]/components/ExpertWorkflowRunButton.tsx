"use client";
import { GraphExecutionMeta } from "@/app/api/__generated__/models/graphExecutionMeta";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { RunAgentModal } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentModal/RunAgentModal";
import { Button } from "@/components/atoms/Button/Button";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  agent: LibraryAgent;
  isTriggerWorkflow: boolean;
  variant?: "primary" | "secondary";
  onRunCreated: (execution: GraphExecutionMeta) => void;
  onTriggerSetup: () => void;
}

export function ExpertWorkflowRunButton({
  agent,
  isTriggerWorkflow,
  onRunCreated,
  onTriggerSetup,
  variant = "secondary",
}: Props) {
  const { t } = useTranslation();
  return (
    <RunAgentModal
      agent={agent}
      title={
        isTriggerWorkflow
          ? t("Set up trigger", "设置触发器")
          : t("Run workflow", "运行工作流")
      }
      dialogVariant="compact"
      onRunCreated={onRunCreated}
      onTriggerSetup={onTriggerSetup}
      triggerSlot={
        <Button
          type="button"
          variant={variant}
          size="small"
          textSize="body-md"
          leadingIcon={PlayIcon}
        >
          {isTriggerWorkflow
            ? t("Set up trigger", "设置触发器")
            : t("Run", "运行")}
        </Button>
      }
    />
  );
}

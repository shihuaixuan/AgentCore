import { ExpertWorkflowRef } from "@/app/api/__generated__/models/expertWorkflowRef";
import { GraphExecutionMeta } from "@/app/api/__generated__/models/graphExecutionMeta";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import {
  Alert01Icon,
  Calendar03Icon,
  FlashIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { workflowNeedsSetup } from "../../helpers";
import { getWorkflowCredentialProviders } from "./WorkflowCredentialStack";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const STATUS = {
  "needs-setup": {
    label: "Needs setup",
    className: "bg-warning-surface text-warning-foreground",
    icon: Alert01Icon,
    iconClassName: "bg-warning-surface text-warning-foreground",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-surface text-foreground-body",
    icon: Calendar03Icon,
    iconClassName: "bg-accent-surface text-brand",
  },
  trigger: {
    label: "Triggered",
    className: "bg-surface text-foreground-body",
    icon: FlashIcon,
    iconClassName: "bg-info-surface text-sky-foreground",
  },
  manual: {
    label: "Manual",
    className: "bg-surface text-foreground-tertiary",
    icon: PlayIcon,
    iconClassName: "bg-surface-hover text-foreground-tertiary",
  },
} as const;

interface Args {
  workflow: ExpertWorkflowRef;
  libraryAgent: LibraryAgent | undefined;
  expertId?: string;
}

export function useExpertWorkflowCard({
  workflow,
  libraryAgent,
  expertId,
}: Args) {
  const { t } = useTranslation();
  const router = useRouter();
  const name = workflow.name ?? t("Unnamed workflow", "未命名工作流");
  const needsSetup = workflowNeedsSetup(workflow);
  const libraryHref = workflow.library_agent_id
    ? `/library/agents/${workflow.library_agent_id}`
    : null;
  const chatPrompt = `Tell me about the workflow "${name}" and how you use it.`;

  function openRun(execution: GraphExecutionMeta) {
    router.push(`${libraryHref}?activeTab=runs&activeItem=${execution.id}`);
  }

  function openTriggers() {
    router.push(`${libraryHref}?activeTab=triggers`);
  }

  const isTriggerWorkflow =
    Boolean(libraryAgent?.trigger_setup_info) ||
    (workflow.chain ?? []).some((item) => item.kind === "trigger");
  const statusKind = needsSetup
    ? "needs-setup"
    : workflow.schedule_cron
      ? "scheduled"
      : isTriggerWorkflow
        ? "trigger"
        : "manual";
  const statusLabels = {
    "needs-setup": "需要设置",
    scheduled: "已计划",
    trigger: "触发运行",
    manual: "手动",
  };

  return {
    name,
    needsSetup,
    runCount: libraryAgent?.execution_count,
    isTriggerWorkflow,
    status: {
      ...STATUS[statusKind],
      label: t(STATUS[statusKind].label, statusLabels[statusKind]),
    },
    credentialProviders: getWorkflowCredentialProviders(
      libraryAgent,
      workflow.chain ?? [],
    ),
    libraryHref,
    builderHref: workflow.graph_id
      ? `/build?flowID=${workflow.graph_id}`
      : null,
    chatPrompt,
    chatHref: `/home?${expertId ? `expertId=${expertId}&` : ""}autosubmit=true#prompt=${encodeURIComponent(chatPrompt)}`,
    openRun,
    openTriggers,
  };
}

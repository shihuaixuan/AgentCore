import { getRunStatusInfo } from "@/components/molecules/RunStatusBadge/RunStatusBadge";
import { AgentExecutionStatus } from "@/app/api/__generated__/models/agentExecutionStatus";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import {
  Alert01Icon,
  Alert02Icon,
  AlertCircleIcon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PauseCircleIcon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type StatusIconMap = {
  icon: React.ReactNode;
  colors: string;
};

const PENDING_COLORS = "bg-warning-surface text-yellow-foreground";

const statusIconMap: Record<AgentExecutionStatus, StatusIconMap> = {
  INCOMPLETE: {
    icon: <Icon icon={AlertCircleIcon} size={16} />,
    colors: "bg-error-surface text-error-foreground",
  },
  QUEUED: {
    icon: <Icon icon={Clock01Icon} size={16} />,
    colors: PENDING_COLORS,
  },
  RUNNING: {
    icon: <Icon icon={PauseCircleIcon} size={16} />,
    colors: PENDING_COLORS,
  },
  REVIEW: {
    icon: <Icon icon={Alert01Icon} size={16} />,
    colors: PENDING_COLORS,
  },
  COMPLETED: {
    icon: <Icon icon={CheckmarkCircle02Icon} size={16} />,
    colors: "bg-success-surface text-success-foreground",
  },
  TERMINATED: {
    icon: <Icon icon={StopCircleIcon} size={16} />,
    colors: "bg-surface-muted text-foreground-body",
  },
  FAILED: {
    icon: <Icon icon={CancelCircleIcon} size={16} />,
    colors: "bg-error-surface text-error-foreground",
  },
};

const completedWithErrorsStyle: StatusIconMap = {
  icon: <Icon icon={Alert02Icon} size={16} />,
  colors: "bg-warning-surface text-warning-foreground",
};

type Props = {
  status: AgentExecutionStatus;
  completedWithErrors?: boolean;
};

export function RunStatusBadge({ status, completedWithErrors = false }: Props) {
  const { t } = useTranslation();
  const labels: Record<AgentExecutionStatus, string> = {
    INCOMPLETE: "未完成",
    QUEUED: "排队中",
    RUNNING: "运行中",
    REVIEW: "待审核",
    COMPLETED: "已完成",
    TERMINATED: "已终止",
    FAILED: "失败",
  };
  const style = completedWithErrors
    ? completedWithErrorsStyle
    : statusIconMap[status];
  const label = completedWithErrors
    ? t("Completed with errors", "已完成，但存在错误")
    : t(getRunStatusInfo(status).label, labels[status]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md p-1 capitalize",
        style.colors,
      )}
    >
      {style.icon}
      <Text variant="small-medium" tone="inherit">
        {label}
      </Text>
    </div>
  );
}

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import type { DisplayStatus } from "../../helpers";
import {
  CircleIcon,
  PauseCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  status: DisplayStatus;
}

export function StatusIcon({ status }: Props) {
  const { t } = useTranslation();
  if (status === "completed") {
    return (
      <Icon
        icon={Tick02Icon}
        size={14}
        tone="success"
        aria-label={t("completed", "已完成")}
      />
    );
  }
  if (status === "in_progress") {
    return (
      <LoadingSpinner
        size="small"
        className="h-3.5 w-3.5 text-brand duration-500"
        aria-label={t("in progress", "进行中")}
      />
    );
  }
  if (status === "stopped") {
    return (
      <Icon
        icon={PauseCircleIcon}
        size={15}
        tone="warning-bright"
        aria-label={t("stopped", "已停止")}
      />
    );
  }
  return (
    <Icon
      icon={CircleIcon}
      size={14}
      tone="subtle"
      aria-label={t("pending", "待处理")}
    />
  );
}

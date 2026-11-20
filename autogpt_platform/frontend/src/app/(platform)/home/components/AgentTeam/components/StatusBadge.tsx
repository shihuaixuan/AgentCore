import type { HomeAgentStatus } from "@/app/api/__generated__/models/homeAgentStatus";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  working: { label: ["Working", "工作中"], dot: "bg-action", pulse: true },
  ready: { label: ["Ready", "就绪"], dot: "bg-success", pulse: false },
  needs_setup: {
    label: ["Finish setup", "完成设置"],
    dot: "bg-warning",
    pulse: false,
  },
  paused: {
    label: ["Paused", "已暂停"],
    dot: "bg-foreground-subtle",
    pulse: false,
  },
  failed: { label: ["Failed", "失败"], dot: "bg-error", pulse: false },
} as const;

const UNKNOWN_STATUS_CONFIG = {
  label: ["Unknown", "未知"],
  dot: "bg-border-strong",
  pulse: false,
} as const;

interface Props {
  status: HomeAgentStatus["status"];
}

/** A dot and a word: the status reads at a glance without a filled pill
 *  competing with the name beside it. */
export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const config = Object.hasOwn(STATUS_CONFIG, status)
    ? STATUS_CONFIG[status]
    : UNKNOWN_STATUS_CONFIG;
  const [english, chinese] = config.label;

  return (
    <Text
      variant="small-medium"
      as="span"
      tone="muted"
      className="inline-flex shrink-0 items-center gap-1.5"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          config.dot,
          config.pulse && "animate-pulse",
        )}
        aria-hidden="true"
      />
      {t(english, chinese)}
    </Text>
  );
}

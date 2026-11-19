import { Icon } from "@/components/atoms/Icon/Icon";
import { PauseCircleIcon } from "@hugeicons/core-free-icons";
import { pausedSchedulesText } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  count: number;
}

export function PausedSchedulesNotice({ count }: Props) {
  const { locale } = useTranslation();
  if (count <= 0) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-warning-border bg-warning-surface/70 px-4 py-1.5 text-body text-foreground-body">
      <Icon icon={PauseCircleIcon} tone="warning" className="size-5 shrink-0" />
      <span>{pausedSchedulesText(count, locale)}</span>
    </div>
  );
}

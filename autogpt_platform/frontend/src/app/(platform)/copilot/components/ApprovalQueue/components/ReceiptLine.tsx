import {
  Cancel01Icon,
  InformationCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import type { Receipt } from "../useApprovalQueue";
import { HeadlineText } from "./ApprovalHeadline";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  receipt: Receipt;
}

export function ReceiptLine({ receipt }: Props) {
  const { t } = useTranslation();
  const translated: Record<string, string> = {
    Approved: "已批准",
    Released: "已放行",
    Rejected: "已拒绝",
    "Kept out": "已屏蔽",
    "Already answered": "已答复",
    "Answered elsewhere": "已在别处答复",
    Expired: "已过期",
    "Not run": "未执行",
  };
  const [icon, tone] =
    receipt.text === "Approved" || receipt.text === "Released"
      ? [Tick02Icon, "text-success"]
      : receipt.text === "Rejected" || receipt.text === "Kept out"
        ? [Cancel01Icon, "text-foreground-subtle"]
        : [InformationCircleIcon, "text-foreground-subtle"];
  return (
    <li className="flex items-center gap-2 px-4 py-2 text-body text-foreground-secondary">
      <Icon icon={icon} size={14} className={tone} aria-hidden />
      <span className="min-w-0 truncate">
        <HeadlineText item={receipt.item} />
      </span>
      <span className="shrink-0 text-foreground-subtle">
        · {t(receipt.text, translated[receipt.text] ?? receipt.text)}
      </span>
    </li>
  );
}

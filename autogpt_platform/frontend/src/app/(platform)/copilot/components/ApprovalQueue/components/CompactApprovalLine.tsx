import { Button } from "@/components/atoms/Button/Button";
import type { ApprovalItem } from "../helpers";
import type { CardStatus } from "./ApprovalCard/ApprovalCard";
import { ApprovalHeadline } from "./ApprovalHeadline";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: ApprovalItem;
  // Nothing beyond the headline to show, so it can be answered in place.
  bare: boolean;
  status: CardStatus;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function CompactApprovalLine({
  item,
  bare,
  status,
  onOpen,
  onApprove,
  onReject,
}: Props) {
  const { t } = useTranslation();
  const busy = status !== "idle";
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 rounded-md text-left hover:opacity-80 focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:outline-none"
      >
        <ApprovalHeadline item={item} compact />
      </button>
      {bare ? (
        <div className="flex shrink-0 gap-2">
          <Button
            size="xs"
            variant="primary"
            shape="pill"
            loading={status === "approving"}
            disabled={busy}
            onClick={onApprove}
          >
            {t("Approve", "批准")}
          </Button>
          <Button
            size="xs"
            variant="secondary"
            shape="pill"
            loading={status === "rejecting"}
            disabled={busy}
            onClick={onReject}
          >
            {t("Reject", "拒绝")}
          </Button>
        </div>
      ) : (
        <Button
          size="xs"
          variant="secondary"
          shape="pill"
          className="shrink-0"
          onClick={onOpen}
        >
          {t("Review", "审核")}
        </Button>
      )}
    </div>
  );
}

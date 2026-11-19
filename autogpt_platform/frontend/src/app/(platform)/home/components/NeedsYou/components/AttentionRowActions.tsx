import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: HomeAttentionItem;
  title?: string;
  isProcessing: boolean;
  confirmDecline: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onDeclineBlur: () => void;
}

export function AttentionRowActions({
  item,
  title = item.title,
  isProcessing,
  confirmDecline,
  onApprove,
  onDecline,
  onDeclineBlur,
}: Props) {
  const { t } = useTranslation();
  const primaryAction = (
    <Button
      as="NextLink"
      href={item.primary_action.href}
      variant="secondary"
      size="row"
    >
      {item.primary_action.label}
    </Button>
  );

  if (item.kind !== "approval" || !item.review) {
    return primaryAction;
  }

  return (
    <>
      {primaryAction}
      <Button
        variant="primary"
        size="icon-sm"
        leadingIcon={Tick02Icon}
        disabled={isProcessing}
        aria-label={t(`Approve: ${title}`, `批准：${title}`)}
        onClick={onApprove}
      />
      <Button
        variant={confirmDecline ? "destructive" : "icon"}
        size="icon-sm"
        leadingIcon={Cancel01Icon}
        disabled={isProcessing}
        aria-label={t(
          `${confirmDecline ? "Confirm decline" : "Decline"}: ${title}`,
          `${confirmDecline ? "确认拒绝" : "拒绝"}：${title}`,
        )}
        onClick={onDecline}
        onBlur={onDeclineBlur}
      />
    </>
  );
}

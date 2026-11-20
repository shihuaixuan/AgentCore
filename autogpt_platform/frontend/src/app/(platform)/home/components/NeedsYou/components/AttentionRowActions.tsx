import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  item: HomeAttentionItem;
  isProcessing: boolean;
  confirmDecline: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onDeclineBlur: () => void;
}

const ACTION_LABEL_ZH = new Map([
  ["Review", "审核"],
  ["Open chat", "打开聊天"],
  ["Review budget", "查看预算"],
  ["Finish setup", "完成设置"],
  ["Fix it", "修复"],
  ["Answer", "回答"],
  ["Add credits", "充值额度"],
]);

export function AttentionRowActions({
  item,
  isProcessing,
  confirmDecline,
  onApprove,
  onDecline,
  onDeclineBlur,
}: Props) {
  const { t } = useTranslation();
  const { href, label } = item.primary_action;
  const primaryAction = (
    <Button as="NextLink" href={href} variant="secondary" size="row">
      {t(label, ACTION_LABEL_ZH.get(label) ?? label)}
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
        aria-label={t(`Approve: ${item.title}`, `批准：${item.title}`)}
        onClick={onApprove}
      />
      <Button
        variant={confirmDecline ? "destructive" : "icon"}
        size="icon-sm"
        leadingIcon={Cancel01Icon}
        disabled={isProcessing}
        aria-label={t(
          `${confirmDecline ? "Confirm decline" : "Decline"}: ${item.title}`,
          `${confirmDecline ? "确认拒绝" : "拒绝"}：${item.title}`,
        )}
        onClick={onDecline}
        onBlur={onDeclineBlur}
      />
    </>
  );
}

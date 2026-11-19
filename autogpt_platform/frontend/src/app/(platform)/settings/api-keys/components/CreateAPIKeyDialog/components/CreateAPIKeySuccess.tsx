"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { toast } from "@/components/molecules/Toast/use-toast";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  plainTextKey: string;
  onClose: () => void;
}

export function CreateAPIKeySuccess({ plainTextKey, onClose }: Props) {
  const { t } = useTranslation();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainTextKey);
      toast({
        title: t("Copied to clipboard", "已复制到剪贴板"),
        variant: "success",
      });
    } catch {
      toast({
        title: t("Could not copy to clipboard", "无法复制到剪贴板"),
        description: t("Please copy the key manually.", "请手动复制密钥。"),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 px-1">
      <Text variant="body" tone="body">
        {t(
          "Copy your key now. For security, we won't show it again.",
          "请立即复制密钥。出于安全考虑，之后将不再显示。",
        )}
      </Text>

      <div className="flex items-center gap-2 rounded-md border border-border-base bg-surface-muted p-3">
        {/* ph-no-capture keeps the one-time key out of PostHog session replays. */}
        <code className="ph-no-capture flex-1 font-mono text-caption break-all text-foreground-emphasis">
          {plainTextKey}
        </code>
        <Button
          variant="secondary"
          size="small"
          leftIcon={<Icon icon={Copy01Icon} size={16} />}
          onClick={handleCopy}
        >
          {t("Copy", "复制")}
        </Button>
      </div>

      <Button variant="primary" size="large" onClick={onClose}>
        {t("Close", "关闭")}
      </Button>
    </div>
  );
}

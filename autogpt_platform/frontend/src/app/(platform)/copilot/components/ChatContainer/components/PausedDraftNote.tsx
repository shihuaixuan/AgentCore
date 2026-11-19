import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function PausedDraftNote() {
  const { t } = useTranslation();
  return (
    <div className="mt-2 px-1">
      <Text tone="muted" variant="small-tight" align="center">
        {t(
          "Your draft is saved. You can keep editing while sending is paused.",
          "草稿已保存。发送暂停期间，你仍可继续编辑。",
        )}
      </Text>
    </div>
  );
}

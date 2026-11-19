import { OrbitLoader } from "../../../OrbitLoader/OrbitLoader";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  expertName?: string;
}

export function ExpertKickoffLoader({ expertName }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full flex-1 flex-col items-center justify-center gap-4 text-center"
    >
      <OrbitLoader size={32} />
      <div>
        <Text variant="large-medium-tight" tone="primary">
          {expertName
            ? t(
                `Opening ${expertName}'s workspace`,
                `正在打开 ${expertName} 的工作区`,
              )
            : t("Opening workspace", "正在打开工作区")}
        </Text>
        <Text variant="body-tight" tone="muted" className="mt-1">
          {t(
            "Your expert is getting ready to start.",
            "你的专家正在准备开始工作。",
          )}
        </Text>
      </div>
    </div>
  );
}

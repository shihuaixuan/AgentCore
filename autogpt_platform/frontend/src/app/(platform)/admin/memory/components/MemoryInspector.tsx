import { environment } from "@/services/environment";
import { MemoryVisualizer } from "./MemoryVisualizer";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function MemoryInspector() {
  const { t } = useTranslation();
  const isAvailable = environment.isGraphMemoryAvailable();

  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-heading font-bold">{t("Memory Inspector", "记忆检查器")}</h1>
          <p className="text-foreground-tertiary">
            {isAvailable
              ? t("View entities, facts, and communities stored in your Graphiti memory graph. Trigger a community rebuild on demand.", "查看 Graphiti 记忆图谱中存储的实体、事实和社区，并按需触发社区重建。")
              : t("Long-term memory is unavailable on this installation.", "此安装环境不支持长期记忆。")}
          </p>
        </div>
        {isAvailable ? <MemoryVisualizer /> : null}
      </div>
    </div>
  );
}

import type { SkippedWebhookPreset } from "@/app/api/__generated__/models/skippedWebhookPreset";
import type { toast } from "@/components/molecules/Toast/use-toast";
import { englishDisplayText, type DisplayTranslate } from "./translation";

// When a new graph version swaps or reconfigures the trigger block, presets
// whose webhook was registered for the old trigger are left pinned to their
// previous version so their existing webhook keeps working. Let the user know
// they need to reconfigure the trigger on the new version.
export function notifySkippedWebhookPresets(
  toastFn: typeof toast,
  skippedPresets: SkippedWebhookPreset[] | undefined | null,
  t: DisplayTranslate = englishDisplayText,
) {
  if (!skippedPresets || skippedPresets.length === 0) return;

  const names = skippedPresets.map((preset) => `"${preset.name}"`).join(", ");
  const single = skippedPresets.length === 1;

  toastFn({
    variant: "info",
    duration: 10000,
    title: single
      ? t("A trigger preset needs reconfiguration", "触发器预设需要重新配置")
      : t(
          "Some trigger presets need reconfiguration",
          "部分触发器预设需要重新配置",
        ),
    description: single
      ? t(
          `${names} was kept on its previous version because the new version uses a different trigger. Reconfigure its trigger on the new version to keep it running.`,
          `${names} 保留在之前的版本，因为新版本使用了不同的触发器。请在新版本上重新配置触发器，以继续运行。`,
        )
      : t(
          `${names} were kept on their previous version because the new version uses a different trigger. Reconfigure their triggers on the new version to keep them running.`,
          `${names} 保留在之前的版本，因为新版本使用了不同的触发器。请在新版本上重新配置各触发器，以继续运行。`,
        ),
  });
}

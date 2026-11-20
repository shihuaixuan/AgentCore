"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { Text } from "../atoms/Text/Text";
import { SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function MobileWarningBanner() {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "base" || breakpoint === "sm";

  if (!isMobile) {
    return null;
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-[32rem] rounded-lg border border-warning-border bg-warning-surface p-4">
      <div className="flex items-start gap-3">
        <Icon
          icon={SmartPhone01Icon}
          tone="warning"
          className="mt-0.5 h-5 w-5 flex-shrink-0"
        />
        <div className="flex flex-col gap-1">
          <Text variant="body-medium" tone="warning">
            {t(
              "Heads up: This app works best on desktop",
              "提示：在电脑上使用体验更佳",
            )}
          </Text>
          <Text variant="small" tone="warning">
            {t(
              "Some features may be limited on mobile. For the best experience, consider switching to a desktop.",
              "移动设备上的部分功能可能受限。建议使用电脑以获得更好的体验。",
            )}
          </Text>
        </div>
      </div>
    </div>
  );
}

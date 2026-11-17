"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useMobileWarning } from "./useMobileWarning";
import { SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function MobileWarning() {
  const { t } = useTranslation();
  const { isOpen, dismiss, suppress } = useMobileWarning();

  return (
    <Dialog
      title={t(
        "Builder works best on desktop",
        "工作流编辑器更适合在电脑上使用",
      )}
      controlled={{
        isOpen,
        set: (next) => {
          if (!next) dismiss();
        },
      }}
    >
      <Dialog.Content>
        <div className="flex flex-col items-center gap-4 px-1 py-2 text-center">
          <Icon icon={SmartPhone01Icon} tone="warning" className="h-10 w-10" />
          <Text variant="body" tone="body">
            {t(
              "The workflow builder relies on canvas interactions that don't work well on this screen size. For the best experience, switch to a desktop browser.",
              "工作流编辑器依赖画布交互，不适合当前屏幕尺寸。为获得最佳体验，请切换到电脑浏览器。",
            )}
          </Text>
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" size="small" onClick={dismiss}>
              {t("Continue anyway", "仍然继续")}
            </Button>
            <Button variant="ghost" size="small" onClick={suppress}>
              {t("Don't show again", "不再提示")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

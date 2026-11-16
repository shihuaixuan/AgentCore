"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { LockIcon } from "@hugeicons/core-free-icons";

const PRIVACY_COPY =
  "Private to you · Saved as Otto memory · Downloadable anytime";

export function PrivacyNote() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 px-4 text-foreground-subtle">
      <Icon icon={LockIcon} size={14} className="shrink-0" />
      <Text
        variant="small"
        tone="subtle"
        className="text-center sm:whitespace-nowrap"
      >
        {t(PRIVACY_COPY, "仅你可见 · 保存为 Otto 记忆 · 随时可下载")}
      </Text>
    </div>
  );
}

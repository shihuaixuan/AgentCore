"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { FEEDBACK_FORM_URL } from "@/components/molecules/TallyPoup/helpers";

interface Props {
  variant?: "kept" | "too_late";
}

export function StillClosedHelp({ variant = "kept" }: Props) {
  const { t } = useTranslation();
  return (
    <Text variant="small" tone="muted">
      {variant === "kept"
        ? t(
            "Still shown as closed? Wait a minute and sign in again. Still closed after a few minutes? ",
            "仍显示已关闭？请稍等一分钟后重新登录。几分钟后仍未恢复？",
          )
        : t("Think this is a mistake? ", "认为出现了错误？")}
      <Link href={FEEDBACK_FORM_URL} isExternal variant="secondary">
        {t("Contact us", "联系我们")}
      </Link>
      .
    </Text>
  );
}

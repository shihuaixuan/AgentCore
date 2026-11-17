"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "../atoms/Button/Button";
import { Link } from "../atoms/Link/Link";
import { Text } from "../atoms/Text/Text";

interface Props {
  onRequestNewLink: () => void;
}

export function ExpiredLinkMessage({ onRequestNewLink }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-6">
      <Text variant="h3" className="text-center">
        {t(
          "Your reset password link has expired or has already been used",
          "密码重置链接已过期或已被使用",
        )}
      </Text>
      <Text variant="body-medium" tone="muted" className="text-center">
        {t(
          "Click below to request a new password reset link.",
          "点击下方按钮获取新的密码重置链接。",
        )}
      </Text>
      <Button variant="primary" onClick={onRequestNewLink} className="w-full">
        {t("Request a New Link", "获取新链接")}
      </Button>
      <div className="flex items-center gap-1">
        <Text variant="small" tone="muted">
          {t("Already have access?", "已经可以登录？")}
        </Text>
        <Link href="/login" variant="secondary">
          {t("Log in here", "前往登录")}
        </Link>
      </div>
    </div>
  );
}

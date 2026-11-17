"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  Link,
  linkBaseClasses,
  linkVariantClasses,
} from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/lib/legal";
import { cn } from "@/lib/utils";

interface Props {
  optedOut: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function SignupLegalLine({ optedOut, onToggle, disabled }: Props) {
  const { t } = useTranslation();
  return (
    <Text variant="body" tone="muted" className="mt-6 text-center">
      {t("By continuing you agree to our", "继续即表示你同意我们的")}{" "}
      <Link href={TERMS_OF_USE_URL} variant="secondary" isExternal>
        {t("Terms of Use", "使用条款")}
      </Link>{" "}
      {t("and", "和")}{" "}
      <Link href={PRIVACY_POLICY_URL} variant="secondary" isExternal>
        {t("Privacy Policy", "隐私政策")}
      </Link>
      .{" "}
      <span aria-live="polite">
        {optedOut ? (
          <span className="text-foreground-base">
            {t("You won't get marketing emails.", "你将不会收到营销邮件。")}
          </span>
        ) : (
          t(
            "We may email you product updates and offers;",
            "我们可能会向你发送产品更新和优惠信息；",
          )
        )}
      </span>{" "}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          linkBaseClasses,
          linkVariantClasses.secondary,
          "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {optedOut ? t("Undo", "撤销") : t("opt out", "退订")}
      </button>
      .
    </Text>
  );
}

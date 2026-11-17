"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";

interface Props {
  token: string;
  loginRedirect: string;
}

export function NotAuthenticatedView({ token, loginRedirect }: Props) {
  const { t } = useTranslation();
  return (
    <AuthCard title={t("Sign in to continue", "登录以继续")}>
      <div className="flex w-full flex-col items-center gap-6">
        <Text variant="body-medium" tone="muted" className="text-center">
          {t(
            "Sign in to your AutoGPT account to finish setting up AutoGPT.",
            "登录 AutoGPT 账户以完成设置。",
          )}
        </Text>
        <Button as="NextLink" href={loginRedirect} className="w-full">
          {t("Sign in", "登录")}
        </Button>
        <AuthCard.BottomText
          text="Don't have an account?"
          link={{ text: "Sign up", href: `/signup?next=/link/${token}` }}
        />
      </div>
    </AuthCard>
  );
}

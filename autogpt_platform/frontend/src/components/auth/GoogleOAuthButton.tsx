"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Image from "next/image";
import { Button } from "../atoms/Button/Button";

interface GoogleOAuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function GoogleOAuthButton({
  onClick,
  isLoading,
  disabled,
}: GoogleOAuthButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={onClick}
      disabled={disabled}
      loading={isLoading}
    >
      <Image src="/google-logo.svg" alt="" width={20} height={20} />
      {isLoading
        ? t("Connecting…", "正在连接…")
        : t("Continue with Google", "使用 Google 继续")}
    </Button>
  );
}

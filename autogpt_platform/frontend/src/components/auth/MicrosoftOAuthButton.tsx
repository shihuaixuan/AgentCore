"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Image from "next/image";
import { Button } from "../atoms/Button/Button";

interface Props {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MicrosoftOAuthButton({ onClick, isLoading, disabled }: Props) {
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
      <Image src="/integrations/microsoft.webp" alt="" width={20} height={20} />
      {isLoading
        ? t("Connecting…", "正在连接…")
        : t("Continue with Microsoft", "使用 Microsoft 继续")}
    </Button>
  );
}

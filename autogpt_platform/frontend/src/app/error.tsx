"use client";

import { useEffect } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { CircleAlertGlyph } from "@/components/atoms/Icon/drawnIcons";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { reloadForChunkLoadError } from "@/lib/chunk-load-reload";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
    reloadForChunkLoadError(error, "error_boundary");
  }, [error]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-canvas">
      <div className="w-full max-w-md px-4 text-center sm:px-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-hover">
          <Icon icon={CircleAlertGlyph} aria-hidden className="size-10" />
        </div>
        <Text variant="heading-md-bold-tracking-tight" as="h1" className="mt-8">
          {t("Oops, something went wrong!", "哎呀，出错了！")}
        </Text>
        <p className="mt-4 text-foreground-tertiary">
          {t(
            "We're sorry, but an unexpected error has occurred. Please try again later or contact support if the issue persists.",
            "很抱歉，发生了意外错误。请稍后重试；如果问题持续，请联系支持团队。",
          )}
        </p>
        <div className="mt-6 flex flex-row justify-center gap-4">
          <Button onClick={reset} variant="compact-outline" size="compact">
            {t("Retry", "重试")}
          </Button>
          <Button variant="compact-primary" size="compact">
            <Link href="/">{t("Go to Homepage", "返回首页")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

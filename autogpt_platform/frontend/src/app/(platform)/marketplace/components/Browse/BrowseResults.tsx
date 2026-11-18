"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { BROWSE_GRID } from "./BrowseHeader";

export function BrowseSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={BROWSE_GRID}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function BrowseMessage({
  message,
  onReset,
}: {
  message: string;
  onReset?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-base px-4 py-10 text-center"
    >
      <Text variant="body" tone="muted">
        {message}
      </Text>
      {onReset && (
        <Button variant="secondary" size="small" onClick={onReset}>
          {t("Clear filters", "清除筛选")}
        </Button>
      )}
    </div>
  );
}

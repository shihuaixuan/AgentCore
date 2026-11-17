import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Link } from "@/components/atoms/Link/Link";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { AIRTABLE_HOME_URL } from "../helpers";

export function LoadingBases() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("Loading your Airtable bases", "正在加载 Airtable 数据库")}
      className="flex flex-col gap-2"
    >
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-11 w-full rounded-2xl" />
      ))}
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

export function BasesError({ message, onRetry, retrying }: ErrorProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-2xl bg-error-surface p-3"
    >
      <Text variant="small" tone="error-strong">
        {message}
      </Text>
      <Button
        type="button"
        size="small"
        variant="secondary"
        loading={retrying}
        onClick={onRetry}
      >
        {t("Try again", "重试")}
      </Button>
    </div>
  );
}

interface RefreshProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export function NoBasesYet({ onRefresh, refreshing }: RefreshProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl bg-surface-muted p-3">
      <Text variant="small" tone="body">
        {t(
          "Your Airtable has no bases yet. Create an empty one in Airtable, then come back and refresh this list.",
          "你的 Airtable 尚无数据库。请先在 Airtable 中创建一个空数据库，然后返回刷新此列表。",
        )}
      </Text>
      <NewBaseActions onRefresh={onRefresh} refreshing={refreshing} />
    </div>
  );
}

export function NewBaseActions({ onRefresh, refreshing }: RefreshProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={AIRTABLE_HOME_URL} isExternal variant="secondary">
        {t("Open Airtable", "打开 Airtable")}
        <span className="sr-only">
          {t(" (opens in a new tab)", "（在新标签页中打开）")}
        </span>
      </Link>
      <Button
        type="button"
        size="small"
        variant="ghost"
        loading={refreshing}
        onClick={onRefresh}
      >
        {t("Refresh list", "刷新列表")}
      </Button>
    </div>
  );
}

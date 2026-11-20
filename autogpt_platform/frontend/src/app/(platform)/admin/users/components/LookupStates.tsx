import { Icon } from "@/components/atoms/Icon/Icon";
import { Link } from "@/components/atoms/Link/Link";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import {
  UserQuestion01Icon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons";
import { getSpendingSearchHref } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="flex text-foreground-subtle">
        <Icon icon={UserSearch01Icon} size={32} aria-hidden />
      </span>
      <Text variant="large-medium" as="h2">
        {t("Look up a user", "查找用户")}
      </Text>
      <Text variant="body" tone="secondary">
        {t("Enter the full username, user ID or email address.", "请输入完整的用户名、用户 ID 或邮箱地址。")}
      </Text>
    </div>
  );
}

export function NotFoundState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="flex text-foreground-subtle">
        <Icon icon={UserQuestion01Icon} size={32} aria-hidden />
      </span>
      <Text variant="large-medium" as="h2" className="break-all">
        {t("No user matches", "没有找到匹配的用户")} <span className="font-medium">{query}</span>
      </Text>
      <Text variant="body" tone="secondary">
        {t("Lookup is exact: use the full username, user ID or email address.", "请使用完整的用户名、用户 ID 或邮箱地址进行精确查找。")}
      </Text>
      <Link
        variant="secondary"
        href={getSpendingSearchHref(query)}
        className="mt-2"
      >
        {t("Search spending history for", "改为搜索消费记录：")}&ldquo;{query}&rdquo;
      </Link>
    </div>
  );
}

export function LookupSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
      aria-label={t("Loading user", "正在加载用户")}
    >
      <Skeleton className="h-[88px] w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[220px] w-full rounded-2xl" />
          <Skeleton className="h-[160px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[180px] w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[260px] w-full rounded-2xl" />
          <Skeleton className="h-[112px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

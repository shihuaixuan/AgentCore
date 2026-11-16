import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { useGetSearchGlobalSearch } from "@/app/api/__generated__/endpoints/search/search";
import type { GlobalSearchResponse } from "@/app/api/__generated__/models/globalSearchResponse";
import { buildActionsBucket } from "./actions";
import { buildBucketsFromResponse } from "./helpers";
import { buildNavigationBucket } from "./navigation";

const DEBOUNCE_MS = 200;
const PER_TYPE_LIMIT = 4;

export function useGlobalSearch(isOpen: boolean) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isBillingEnabled = useIsBillingEnabled();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { data, isFetching, isError } = useGetSearchGlobalSearch(
    { q: debouncedQuery.trim(), per_type_limit: PER_TYPE_LIMIT },
    {
      query: {
        enabled: isOpen,
        // Keep the previous bucket of results visible while a new
        // query is in-flight so the modal doesn't flash empty on every
        // keystroke.
        placeholderData: (prev) => prev,
        // Recent-items (empty query) responses are cached server-side
        // but a short client cache cuts the request on quick re-opens.
        staleTime: 10_000,
      },
    },
  );

  const response =
    data?.status === 200 ? (data.data as GlobalSearchResponse) : undefined;

  // First fetch after opening: no results have landed yet (``placeholderData``
  // keeps the previous response on every later fetch, so ``response`` is only
  // undefined here). Suppress the instant command buckets too while this is
  // true — otherwise navigation/actions render immediately, the modal looks
  // "done", and the async results pop in a second later and shove everything
  // down. Returning no buckets lets the modal show its loading skeleton, then
  // results + commands appear together with no re-layout.
  const isInitialLoading = isFetching && !response;

  const { buckets: searchBuckets, itemsById } =
    buildBucketsFromResponse(response);

  // Client-side command buckets (navigation + actions) filtered against
  // the live query (no debounce — local match is instant). On an exact
  // name match ("Builder", "Copy user ID") the bucket is hoisted above
  // the search results; otherwise it trails them so search stays the
  // primary intent. Priority order on exact match: navigation, actions.
  const commandQuery =
    (
      {
        构建器: "Builder",
        工作流库: "Library",
        市场: "Marketplace",
        对话: "Chat",
        设置: "Settings",
        账单: "Billing",
        个人资料: "Profile",
        "复制用户 ID": "Copy user ID",
      } as Record<string, string>
    )[query.trim()] ?? query;
  const commandBuckets = [
    buildNavigationBucket(commandQuery, pathname, isBillingEnabled),
    buildActionsBucket(commandQuery),
  ];
  const topBuckets = commandBuckets.flatMap((entry) =>
    entry.bucket && entry.isExactMatch ? [entry.bucket] : [],
  );
  const bottomBuckets = commandBuckets.flatMap((entry) =>
    entry.bucket && !entry.isExactMatch ? [entry.bucket] : [],
  );

  const buckets = isInitialLoading
    ? []
    : [...topBuckets, ...searchBuckets, ...bottomBuckets].map((bucket) => ({
        ...bucket,
        label: t(
          bucket.label,
          (
            {
              Navigate: "导航",
              Actions: "操作",
              Workflows: "工作流",
              Files: "文件",
              Chats: "对话",
            } as Record<string, string>
          )[bucket.label] ?? bucket.label,
        ),
        items:
          bucket.key === "navigation" || bucket.key === "actions"
            ? bucket.items.map((item) => ({
                ...item,
                title: t(
                  item.title,
                  (
                    {
                      Builder: "构建器",
                      Library: "工作流库",
                      Marketplace: "市场",
                      Chat: "对话",
                      Settings: "设置",
                      Billing: "账单",
                      Profile: "个人资料",
                      "Copy user ID": "复制用户 ID",
                    } as Record<string, string>
                  )[item.title] ?? item.title,
                ),
              }))
            : bucket.items,
      }));

  return {
    query,
    setQuery,
    buckets,
    itemsById,
    isFetching,
    isError,
  };
}

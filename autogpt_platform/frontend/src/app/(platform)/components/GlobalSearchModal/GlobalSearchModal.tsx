"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SearchResultItem } from "@/app/api/__generated__/models/searchResultItem";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { SearchCommandModal } from "@/components/organisms/SearchCommandModal/SearchCommandModal";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIONS_BUCKET_KEY, COPY_USER_ID_ACTION } from "./actions";
import { NAV_BUCKET_KEY, getNavigationHref } from "./navigation";
import { useGlobalSearch } from "./useGlobalSearch";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: SearchResultItem) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onSelectItem }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  const { query, setQuery, buckets, itemsById, isFetching, isError } =
    useGlobalSearch(isOpen);
  // Id of the row whose select is in-flight. The modal stays open with a
  // trailing spinner on that row while the work runs — a navigation
  // routing to a (possibly slow) page, or an action awaiting a side
  // effect like a clipboard write.
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setBusyItemId(null);
  }, [isOpen]);

  // A navigation row keeps the spinner up until the route actually
  // changes (router.push resolves async). Clearing on the resolved
  // pathname is the real end of the action — don't rely on the tree
  // unmounting, so the row never stays stuck if this modal ever lives
  // in a layout that persists across pages.
  useEffect(() => {
    setBusyItemId(null);
  }, [pathname]);

  async function runAction(id: string) {
    if (id === COPY_USER_ID_ACTION) {
      if (!user?.id) {
        toast({
          title: t("You're not signed in", "你尚未登录"),
          variant: "destructive",
        });
        return;
      }
      try {
        await navigator.clipboard.writeText(user.id);
        toast({
          title: t("User ID copied to clipboard", "用户 ID 已复制到剪贴板"),
        });
      } catch {
        toast({
          title: t("Couldn't copy User ID", "无法复制用户 ID"),
          variant: "destructive",
        });
      }
    }
  }

  function handleSelect(id: string, bucketKey: string) {
    if (busyItemId) return;
    if (bucketKey === NAV_BUCKET_KEY) {
      const href = getNavigationHref(id);
      if (!href) return;
      // No close: the destination page mounting unmounts this tree.
      setBusyItemId(id);
      router.push(href);
      return;
    }
    if (bucketKey === ACTIONS_BUCKET_KEY) {
      setBusyItemId(id);
      void runAction(id).finally(onClose);
      return;
    }
    const apiItem = itemsById.get(id);
    if (!apiItem) return;
    onSelectItem(apiItem);
    onClose();
  }

  return (
    <SearchCommandModal
      isOpen={isOpen}
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      buckets={buckets}
      isLoading={isFetching}
      isError={isError}
      placeholder={t(
        "Search workflows, files, chats...",
        "搜索工作流、文件、对话…",
      )}
      inputAriaLabel={t("Global search", "全局搜索")}
      idleEmptyLabel={t("No recent items", "暂无最近项目")}
      searchingEmptyLabel={t("No results found", "未找到结果")}
      loadingItemId={busyItemId ?? undefined}
      onSelectItem={(item, bucketKey) => handleSelect(item.id, bucketKey)}
    />
  );
}

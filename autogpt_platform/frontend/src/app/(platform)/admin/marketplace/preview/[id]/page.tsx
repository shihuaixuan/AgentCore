"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentInfo } from "@/app/(platform)/marketplace/components/AgentInfo/AgentInfo";
import { AgentImages } from "@/app/(platform)/marketplace/components/AgentImages/AgentImage";
import type { StoreAgentDetails } from "@/app/api/__generated__/models/storeAgentDetails";
import { previewAsAdmin, addToLibraryAsAdmin } from "../../actions";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export default function AdminPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [data, setData] = useState<StoreAgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await previewAsAdmin(params.id);
        setData(result as StoreAgentDetails);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("Failed to load preview", "无法加载预览"));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleAddToLibrary() {
    setIsAddingToLibrary(true);
    try {
      await addToLibraryAsAdmin(params.id);
      toast({
        title: t("Added to Library", "已添加到库"),
        description: t("Agent has been added to your library for review.", "工作流已添加到你的库中，可供审核。"),
        duration: 3000,
      });
    } catch (e) {
      toast({
        title: t("Error", "错误"),
        description:
          e instanceof Error ? e.message : t("Failed to add agent to library.", "无法将工作流添加到库中。"),
        variant: "destructive",
      });
    } finally {
      setIsAddingToLibrary(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground-tertiary">{t("Loading preview...", "正在加载预览...")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-error">{error || t("Preview not found", "未找到预览")}</p>
        <button
          onClick={() => router.back()}
          className="text-foreground-tertiary underline"
        >
          {t("Go back", "返回")}
        </button>
      </div>
    );
  }

  const allMedia = [
    ...(data.agent_video ? [data.agent_video] : []),
    ...(data.agent_output_demo ? [data.agent_output_demo] : []),
    ...data.agent_image,
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-body text-foreground-tertiary hover:text-foreground-base"
        >
          <Icon icon={ArrowLeft02Icon} size={16} />
          {t("Back to Admin Marketplace", "返回管理市场")}
        </button>

        <div className="flex items-center gap-3">
          <span className="rounded-md bg-warning/20 px-3 py-1 text-body font-medium text-warning-foreground">
            {t("Admin Preview", "管理预览")}
            {!data.has_approved_version && ` — ${t("Pending Approval", "待审核")}`}
          </span>
          <button
            onClick={handleAddToLibrary}
            disabled={isAddingToLibrary}
            className="rounded-md bg-action px-4 py-2 text-body font-medium text-action-foreground hover:bg-action/90 disabled:opacity-50"
          >
            {isAddingToLibrary ? t("Adding...", "正在添加...") : t("Add to My Library", "添加到我的库")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AgentInfo
            user={null}
            name={data.agent_name}
            creator={data.creator}
            creatorAvatar={data.creator_avatar}
            shortDescription={data.sub_heading}
            longDescription={data.description}
            runs={data.runs}
            categories={data.categories}
            lastUpdated={String(data.last_updated)}
            version={data.versions[0] || "1"}
            storeListingVersionId={data.store_listing_version_id}
            isAgentAddedToLibrary={false}
          />
        </div>
        <div className="lg:col-span-3">
          {allMedia.length > 0 ? (
            <AgentImages images={allMedia} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-foreground-tertiary/25">
              <p className="text-foreground-tertiary">
                {t("No images or videos submitted", "未提交图片或视频")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fields not shown in AgentInfo but important for admin review */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.instructions && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-body font-semibold text-foreground-tertiary">
              {t("Instructions", "说明")}
            </h3>
            <p className="text-body whitespace-pre-wrap">{data.instructions}</p>
          </div>
        )}
        {data.recommended_schedule_cron && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-body font-semibold text-foreground-tertiary">
              {t("Recommended Schedule", "推荐计划")}
            </h3>
            <code className="rounded bg-surface-hover px-2 py-1 text-body">
              {data.recommended_schedule_cron}
            </code>
          </div>
        )}
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-body font-semibold text-foreground-tertiary">
            {t("Slug", "标识符")}
          </h3>
          <code className="rounded bg-surface-hover px-2 py-1 text-body">
            {data.slug}
          </code>
        </div>
      </div>
    </div>
  );
}

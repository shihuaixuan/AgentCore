"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import type { HomeActiveTask } from "@/app/api/__generated__/models/homeActiveTask";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { WorkflowAvatar } from "@/components/molecules/WorkflowAvatar/WorkflowAvatar";
import { cn } from "@/lib/utils";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { formatRunningFor } from "../helpers";

interface Props {
  item: HomeActiveTask;
}

// oxlint-disable-next-line design-system/no-arbitrary-values -- the 60px indent lines the row up with the timeline column; the spacing scale has 14 (56px) and 16 (64px)
const ROW_CLASS = "relative flex items-center gap-3 py-2 pl-[3.75rem] pr-4";

export function ActiveRow({ item }: Props) {
  const { t, locale } = useTranslation();
  const content = (
    <>
      <span className="absolute top-1/2 left-4 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface">
        {item.expert ? (
          <ExpertAvatar
            name={getExpertDisplayTitle(item.expert, locale)}
            avatarUrl={item.expert.avatar_url}
            size={36}
          />
        ) : (
          <WorkflowAvatar
            name={item.title}
            imageUrl={item.image_url}
            size={36}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <Text variant="body-medium-tight" tone="primary" className="truncate">
          <span>{item.title}</span>
          <span className="font-normal text-foreground-tertiary">
            {" "}
            {t("workflow", "工作流")}
          </span>
        </Text>
        <Text variant="small" tone="muted" className="truncate">
          {item.status === "queued"
            ? t("Queued", "排队中")
            : (formatRunningFor(item.started_at, undefined, t) ??
              t("Running now", "正在运行"))}
        </Text>
      </div>
    </>
  );

  if (!item.link) return <div className={ROW_CLASS}>{content}</div>;
  return (
    <Link
      href={item.link}
      className={cn(
        ROW_CLASS,
        "transition-colors outline-none hover:bg-surface-muted focus-visible:bg-surface-muted",
      )}
    >
      {content}
    </Link>
  );
}

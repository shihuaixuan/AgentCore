"use client";

import { StoreAgent } from "@/app/api/__generated__/models/storeAgent";
import { isLocalStoreMediaUrl } from "@/lib/store-media";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Image from "next/image";
import { useState } from "react";
import { ShelfTile } from "../../Shelf/ShelfTile";

interface Props {
  agent: StoreAgent;
}

export function WorkflowTile({ agent }: Props) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const runs = agent.runs ?? 0;

  return (
    <ShelfTile
      testId="workflow-tile"
      href={`/marketplace/agent/${encodeURIComponent(agent.creator)}/${encodeURIComponent(agent.slug)}`}
      mediaClassName="bg-brand/10 ring-1 ring-foreground-base/5"
      media={
        agent.agent_image && !imageError ? (
          <Image
            src={agent.agent_image}
            unoptimized={isLocalStoreMediaUrl(agent.agent_image)}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : null
      }
      title={agent.agent_name}
      subtitle={
        agent.sub_heading ||
        agent.description ||
        t("View workflow", "查看工作流")
      }
      trailing={
        <span className="shrink-0 text-caption text-foreground-tertiary">
          {runs === 0
            ? t("No runs", "暂无运行")
            : t(
                `${runs.toLocaleString()} runs`,
                `${runs.toLocaleString()} 次运行`,
              )}
        </span>
      }
    />
  );
}

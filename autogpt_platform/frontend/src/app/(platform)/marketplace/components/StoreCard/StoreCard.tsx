"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import { StarFilledGlyph, StarGlyph } from "@/components/atoms/Icon/drawnIcons";
import Avatar, {
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/Avatar/Avatar";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import Image from "next/image";
import { isLocalStoreMediaUrl } from "@/lib/store-media";
import { useState } from "react";
import { AddToLibraryButton } from "../AddToLibraryButton/AddToLibraryButton";
import { isKey } from "@/lib/keyboard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  agentName: string;
  agentImage: string;
  description: string;
  runs: number;
  rating: number;
  onClick: () => void;
  avatarSrc: string;
  hideAvatar?: boolean;
  creatorName?: string;
  creatorSlug?: string;
  agentSlug?: string;
  agentGraphID?: string;
}

export function StoreCard({
  agentName,
  agentImage,
  description,
  runs,
  rating,
  onClick,
  avatarSrc,
  hideAvatar = false,
  creatorName,
  creatorSlug,
  agentSlug,
  agentGraphID,
}: Props) {
  const { t, locale } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    onClick();
  };

  return (
    <div
      // oxlint-disable-next-line design-system/no-arbitrary-values -- the card's hover lift shadow has no shadow token
      className="group relative flex h-[26rem] w-full max-w-md cursor-pointer flex-col items-start rounded-2xl border border-border-base/80 bg-surface p-5 shadow-message-table transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_16px_40px_-16px_rgba(16,24,40,0.18)]"
      onClick={handleClick}
      data-testid="store-card"
      role="button"
      tabIndex={0}
      aria-label={t(`${agentName} workflow card`, `${agentName} 工作流卡片`)}
      onKeyDown={(e) => {
        if (isKey(e, "Enter", " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative aspect-[2/1.2] w-full overflow-hidden rounded-xl ring-1 ring-foreground-base/5 md:aspect-[2.17/1]">
        {agentImage && !imageError ? (
          <>
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 rounded-xl" />
            )}
            <Image
              src={agentImage}
              unoptimized={isLocalStoreMediaUrl(agentImage)}
              alt={t(`${agentName} preview image`, `${agentName} 预览图`)}
              fill
              className="object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 rounded-xl bg-brand/10" />
        )}
      </div>

      <div className="mt-4 flex w-full flex-1 flex-col">
        <h3
          className="line-clamp-1 font-sans text-lead font-semibold tracking-title text-foreground-strong"
          title={agentName}
        >
          {agentName}
        </h3>
        {!hideAvatar && creatorName && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar className="h-5 w-5 shrink-0">
              {avatarSrc && (
                <AvatarImage
                  src={avatarSrc}
                  alt={t(
                    `${creatorName} creator avatar`,
                    `创作者 ${creatorName} 的头像`,
                  )}
                />
              )}
              <AvatarFallback size={20}>{creatorName}</AvatarFallback>
            </Avatar>
            <span className="truncate text-body-sm leading-inherit text-foreground-tertiary">
              {t(`by ${creatorName}`, `创建者：${creatorName}`)}
            </span>
          </div>
        )}
        <p className="mt-3 line-clamp-3 text-body leading-relaxed text-foreground-secondary">
          {description}
        </p>
      </div>

      <div className="mt-auto flex w-full items-center pt-3">
        <span className="flex items-center gap-2 text-caption text-foreground-tertiary">
          {runs === 0
            ? t("No runs", "尚未运行")
            : t(
                `${runs.toLocaleString(locale)} runs`,
                `运行 ${runs.toLocaleString(locale)} 次`,
              )}
          {rating >= 1 && (
            <span
              className="inline-flex items-center gap-1 text-foreground-base"
              role="img"
              aria-label={t(
                `Rating: ${rating.toFixed(1)} out of 5 stars`,
                `评分：${rating.toFixed(1)} / 5 星`,
              )}
            >
              <span className="font-medium text-foreground-body">
                {rating.toFixed(1)}
              </span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  icon={star <= rating ? StarFilledGlyph : StarGlyph}
                  aria-hidden
                  className="size-4"
                />
              ))}
            </span>
          )}
        </span>
      </div>
      {creatorSlug && agentSlug && agentGraphID && (
        <div className="absolute right-4 bottom-4">
          <AddToLibraryButton
            creatorSlug={creatorSlug}
            agentSlug={agentSlug}
            agentName={agentName}
            agentGraphID={agentGraphID}
          />
        </div>
      )}
    </div>
  );
}

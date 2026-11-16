"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertPod } from "@/app/api/__generated__/models/expertPod";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ArrowLeft01Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { ReactNode, useState } from "react";
import { TEAM_GRID_CLASS } from "../../helpers";

interface Props {
  isLoading: boolean;
  podGroups: { pod: ExpertPod; experts: Expert[] }[];
  onNewPod: () => void;
  renderCard: (expert: Expert) => ReactNode;
}

const FOLDER_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

export function PodBoard({
  isLoading,
  podGroups,
  onNewPod,
  renderCard,
}: Props) {
  const { t } = useTranslation();
  const [openPodId, setOpenPodId] = useState<string | null>(null);
  const openGroup = podGroups.find((group) => group.pod.id === openPodId);

  if (openGroup) {
    return (
      <section
        aria-label={t(
          `${openGroup.pod.name} pod`,
          `${openGroup.pod.name} 小组`,
        )}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            leadingIcon={ArrowLeft01Icon}
            aria-label={t("Back to pods", "返回小组")}
            onClick={() => setOpenPodId(null)}
          />
          <Text variant="large-medium" as="h5" tone="primary">
            {openGroup.pod.name}
          </Text>
          <Text variant="small" tone="muted">
            {openGroup.experts.length}{" "}
            {openGroup.experts.length === 1 ? "expert" : "experts"}
          </Text>
        </div>
        {openGroup.experts.length > 0 ? (
          <div className={TEAM_GRID_CLASS}>
            {openGroup.experts.map(renderCard)}
          </div>
        ) : (
          <Text variant="body" tone="muted">
            {t(
              "No experts in this pod yet. Move one in from its card menu.",
              "此小组暂无专家。可通过专家卡片菜单将其移入。",
            )}
          </Text>
        )}
      </section>
    );
  }

  return (
    <section aria-label={t("Pods", "小组")} className="flex flex-col gap-4">
      <Text variant="large-medium" as="h5" tone="primary">
        {t("Pods", "小组")}
      </Text>
      {isLoading ? (
        <div className={FOLDER_GRID_CLASS}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : podGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
          <Text variant="large-medium" tone="primary">
            {t("No pods yet", "暂无小组")}
          </Text>
          <Text variant="body" tone="secondary" className="max-w-prose">
            {t(
              "Group experts into pods to keep related work together.",
              "将专家分组，集中管理相关工作。",
            )}
          </Text>
          <Button variant="primary" size="small" onClick={onNewPod}>
            {t("New Pod", "新建小组")}
          </Button>
        </div>
      ) : (
        <div className={FOLDER_GRID_CLASS}>
          {podGroups.map((group) => (
            <PodFolder
              key={group.pod.id}
              name={group.pod.name}
              experts={group.experts}
              onOpen={() => setOpenPodId(group.pod.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface PodFolderProps {
  name: string;
  experts: Expert[];
  onOpen: () => void;
}

function PodFolder({ name, experts, onOpen }: PodFolderProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t(`Open ${name} pod`, `打开 ${name} 小组`)}
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4 text-left smooth-shadow-ring-sm transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-foreground-subtle focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-foreground-secondary">
          <Icon icon={Folder02Icon} size={20} />
        </span>
        <div className="min-w-0">
          <Text
            variant="large-medium"
            as="h5"
            tone="primary"
            className="truncate"
          >
            {name}
          </Text>
          <Text variant="small" tone="muted">
            {experts.length} {experts.length === 1 ? "expert" : "experts"}
          </Text>
        </div>
      </div>
      {experts.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {experts.map((expert) => (
            <li
              key={expert.id}
              className="max-w-full truncate rounded-md bg-surface-muted px-2 py-0.5 font-sans text-caption text-foreground-secondary ring-1 ring-border-base ring-inset"
            >
              {expert.name}
            </li>
          ))}
        </ul>
      ) : (
        <Text variant="small" tone="muted">
          {t("No experts in this pod yet.", "此小组暂无专家。")}
        </Text>
      )}
    </button>
  );
}

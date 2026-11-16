"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import Link from "next/link";
import { useRemoveTriggerAgent } from "../../../hooks/useRemoveTriggerAgent";
import {
  Delete02Icon,
  LinkSquare01Icon,
  PencilIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  parentAgent: LibraryAgent;
  triggerAgent: LibraryAgent;
  onDeleted?: () => void;
}

export function SelectedTriggerAgentActions({
  parentAgent,
  triggerAgent,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const { openDialog, isDeleting, dialog } = useRemoveTriggerAgent({
    parentAgent,
    triggerAgent,
    onDeleted,
  });

  return (
    <>
      <div className="my-4 flex flex-col items-center gap-3">
        <Link
          href={`/library/agents/${triggerAgent.id}`}
          aria-label={t("View in library", "在工作流库中查看")}
        >
          <Button
            variant="icon"
            size="icon"
            aria-label={t("View in library", "在工作流库中查看")}
          >
            <Icon icon={LinkSquare01Icon} size={18} />
          </Button>
        </Link>
        <Link
          href={`/build?flowID=${triggerAgent.graph_id}`}
          aria-label={t("Open in builder", "在构建器中打开")}
        >
          <Button
            variant="icon"
            size="icon"
            aria-label={t("Open in builder", "在构建器中打开")}
          >
            <Icon icon={PencilIcon} size={18} />
          </Button>
        </Link>
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Remove trigger", "移除触发器")}
          onClick={openDialog}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <LoadingSpinner size="small" />
          ) : (
            <Icon icon={Delete02Icon} size={18} />
          )}
        </Button>
      </div>
      {dialog}
    </>
  );
}

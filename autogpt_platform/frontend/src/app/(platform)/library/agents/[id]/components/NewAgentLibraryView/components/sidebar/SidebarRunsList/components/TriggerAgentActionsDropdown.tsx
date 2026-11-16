"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import Link from "next/link";
import { useRemoveTriggerAgent } from "../../../../hooks/useRemoveTriggerAgent";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  parentAgent: LibraryAgent;
  triggerAgent: LibraryAgent;
  onDeleted?: () => void;
}

export function TriggerAgentActionsDropdown({
  parentAgent,
  triggerAgent,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const { openDialog, dialog } = useRemoveTriggerAgent({
    parentAgent,
    triggerAgent,
    onDeleted,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="icon"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("More actions", "更多操作")}
            className="ml-auto min-w-fit shrink-0"
          >
            <Icon icon={MoreVerticalIcon} size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/library/agents/${triggerAgent.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {t("View in library", "在工作流库中查看")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/build?flowID=${triggerAgent.graph_id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {t("Open in builder", "在构建器中打开")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              openDialog();
            }}
          >
            {t("Remove trigger", "移除触发器")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog}
    </>
  );
}

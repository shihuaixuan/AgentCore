"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV2ListPresetsQueryKey,
  useDeleteV2DeleteAPreset,
} from "@/app/api/__generated__/endpoints/presets/presets";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import type { LibraryAgentPreset } from "@/app/api/__generated__/models/libraryAgentPreset";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  trigger: LibraryAgentPreset;
  onDeleted?: () => void;
}

export function TriggerActionsDropdown({ agent, trigger, onDeleted }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutateAsync: deletePreset, isPending: isDeleting } =
    useDeleteV2DeleteAPreset();

  async function handleDelete() {
    try {
      await deletePreset({ presetId: trigger.id });

      toast({
        title: t("Trigger deleted", "触发器已删除"),
      });

      queryClient.invalidateQueries({
        queryKey: getGetV2ListPresetsQueryKey({
          graph_id: agent.graph_id,
        }),
      });

      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (error: unknown) {
      toast({
        title: t("Failed to delete trigger", "无法删除触发器"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="ml-auto shrink-0 rounded p-1 text-foreground-subtle hover:bg-surface-hover"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("More actions", "更多操作")}
          >
            <Icon icon={MoreVerticalIcon} className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            {t("Delete trigger", "删除触发器")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete trigger", "删除触发器")}
      >
        <Dialog.Content>
          <div>
            <Text variant="large">
              {t(
                "Are you sure you want to delete this trigger? This action cannot be undone.",
                "确定要删除此触发器吗？此操作无法撤销。",
              )}
            </Text>
            <Dialog.Footer>
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
              >
                {t("Delete Trigger", "删除触发器")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

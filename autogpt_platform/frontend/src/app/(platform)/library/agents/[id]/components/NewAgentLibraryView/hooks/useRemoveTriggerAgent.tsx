"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV2ListTriggerAgentsQueryKey,
  useDeleteV2DeleteLibraryAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface Args {
  parentAgent: LibraryAgent;
  triggerAgent: LibraryAgent;
  onDeleted?: () => void;
}

/**
 * Shared delete flow for a trigger agent — confirmation dialog,
 * mutation, toast notifications, and parent-list invalidation.
 *
 * Used by both `SelectedTriggerAgentActions` (side panel icon button)
 * and `TriggerAgentActionsDropdown` (sidebar three-dots menu), which
 * render different triggers but need identical delete behavior.
 */
export function useRemoveTriggerAgent({
  parentAgent,
  triggerAgent,
  onDeleted,
}: Args): {
  openDialog: () => void;
  isDeleting: boolean;
  dialog: ReactNode;
} {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const { mutate: deleteLibraryAgent, isPending } =
    useDeleteV2DeleteLibraryAgent({
      mutation: {
        onSuccess: async () => {
          toast({ title: "Trigger removed" });
          queryClient.invalidateQueries({
            queryKey: getGetV2ListTriggerAgentsQueryKey(parentAgent.id),
          });
          setShowDialog(false);
          onDeleted?.();
        },
        onError: (error) => {
          toast({
            title: t("Failed to remove trigger", "无法移除触发器"),
            description:
              error instanceof Error
                ? error.message
                : t("An unexpected error occurred.", "发生意外错误。"),
            variant: "destructive",
          });
        },
      },
    });

  function handleDelete() {
    deleteLibraryAgent({ libraryAgentId: triggerAgent.id });
  }

  const dialog = (
    <Dialog
      controlled={{ isOpen: showDialog, set: setShowDialog }}
      styling={{ maxWidth: "32rem" }}
      title={t("Remove trigger", "移除触发器")}
    >
      <Dialog.Content>
        <Text variant="large">
          {t(
            "Are you sure you want to remove this trigger? The trigger workflow and its schedule will be deleted. This action cannot be undone.",
            "确定要移除此触发器吗？触发工作流及其计划将被删除。此操作无法撤销。",
          )}
        </Text>
        <Dialog.Footer>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => setShowDialog(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isPending}
          >
            {t("Remove trigger", "移除触发器")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );

  return {
    openDialog: () => setShowDialog(true),
    isDeleting: isPending,
    dialog,
  };
}

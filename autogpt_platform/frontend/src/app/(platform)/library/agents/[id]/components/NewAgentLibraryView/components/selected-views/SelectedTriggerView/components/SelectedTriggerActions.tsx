"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV2ListPresetsQueryKey,
  getV2ListPresets,
  useDeleteV2DeleteAPreset,
} from "@/app/api/__generated__/endpoints/presets/presets";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { okData } from "@/app/api/helpers";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AgentActionsDropdown } from "../../AgentActionsDropdown";
import { Delete02Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  triggerId: string;
  onDeleted?: () => void;
  onSaveChanges?: () => void;
  isSaving?: boolean;
  onSwitchToRunsTab?: () => void;
}

export function SelectedTriggerActions({
  agent,
  triggerId,
  onDeleted,
  onSaveChanges,
  isSaving,
  onSwitchToRunsTab,
}: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useDeleteV2DeleteAPreset({
    mutation: {
      onSuccess: async () => {
        toast({
          title: "Trigger deleted",
        });
        const queryKey = getGetV2ListPresetsQueryKey({
          graph_id: agent.graph_id,
        });

        queryClient.invalidateQueries({
          queryKey,
        });

        const queryData =
          queryClient.getQueryData<
            Awaited<ReturnType<typeof getV2ListPresets>>
          >(queryKey);

        const presets = okData(queryData)?.presets ?? [];
        const triggers = presets.filter((preset) => preset.webhook_id);

        setShowDeleteDialog(false);
        onDeleted?.();

        if (triggers.length === 0 && onSwitchToRunsTab) {
          onSwitchToRunsTab();
        }
      },
      onError: (error: any) => {
        toast({
          title: t("Failed to delete trigger", "无法删除触发器"),
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      },
    },
  });

  function handleDelete() {
    deleteMutation.mutate({ presetId: triggerId });
  }

  return (
    <>
      <div className="my-4 flex flex-col items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Save changes", "保存更改")}
          onClick={onSaveChanges}
          disabled={isSaving || deleteMutation.isPending}
        >
          {isSaving ? (
            <LoadingSpinner size="small" />
          ) : (
            <Icon icon={FloppyDiskIcon} size={18} />
          )}
        </Button>
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Delete trigger", "删除触发器")}
          onClick={() => setShowDeleteDialog(true)}
          disabled={isSaving || deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <LoadingSpinner size="small" />
          ) : (
            <Icon icon={Delete02Icon} size={18} />
          )}
        </Button>
        <AgentActionsDropdown agent={agent} />
      </div>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete trigger", "删除触发器")}
      >
        <Dialog.Content>
          <Text variant="large">
            {t(
              "Are you sure you want to delete this trigger? This action cannot be undone.",
              "确定要删除此触发器吗？此操作无法撤销。",
            )}
          </Text>
          <Dialog.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              {t("Delete", "删除")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV1ListGraphExecutionsQueryKey,
  useDeleteV1DeleteGraphExecution,
} from "@/app/api/__generated__/endpoints/graphs/graphs";
import {
  getGetV2ListPresetsQueryKey,
  usePostV2CreateANewPreset,
} from "@/app/api/__generated__/endpoints/presets/presets";
import type { GraphExecutionMeta } from "@/app/api/__generated__/models/graphExecutionMeta";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreateTemplateModal } from "../../../selected-views/SelectedRunView/components/CreateTemplateModal/CreateTemplateModal";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  run: GraphExecutionMeta;
  onDeleted?: () => void;
}

export function TaskActionsDropdown({ agent, run, onDeleted }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] =
    useState(false);

  const { mutateAsync: deleteRun, isPending: isDeletingRun } =
    useDeleteV1DeleteGraphExecution();

  const { mutateAsync: createPreset } = usePostV2CreateANewPreset();

  async function handleDeleteRun() {
    try {
      await deleteRun({ graphExecId: run.id });

      toast({ title: "Task deleted" });

      await queryClient.refetchQueries({
        queryKey: getGetV1ListGraphExecutionsQueryKey(agent.graph_id),
      });

      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (error: unknown) {
      toast({
        title: "Failed to delete task",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  async function handleCreateTemplate(name: string, description: string) {
    try {
      const res = await createPreset({
        data: {
          name,
          description,
          graph_execution_id: run.id,
        },
      });

      if (res.status === 200) {
        toast({
          title: "Template created",
        });

        queryClient.invalidateQueries({
          queryKey: getGetV2ListPresetsQueryKey({
            graph_id: agent.graph_id,
          }),
        });

        setIsCreateTemplateModalOpen(false);
      }
    } catch (error: unknown) {
      toast({
        title: "Failed to create template",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
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
              setIsCreateTemplateModalOpen(true);
            }}
          >
            {t("Save as template", "另存为模板")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            {t("Delete task", "删除任务")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete task", "删除任务")}
      >
        <Dialog.Content>
          <div>
            <Text variant="large">
              {t(
                "Are you sure you want to delete this task? This action cannot be undone.",
                "确定要删除此任务吗？此操作无法撤销。",
              )}
            </Text>
            <Dialog.Footer>
              <Button
                variant="secondary"
                disabled={isDeletingRun}
                onClick={() => setShowDeleteDialog(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRun}
                loading={isDeletingRun}
              >
                {t("Delete Task", "删除任务")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>

      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        onCreate={handleCreateTemplate}
        run={run as any}
      />
    </>
  );
}

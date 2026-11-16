"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV1ListGraphExecutionsQueryKey,
  usePostV1ExecuteGraphAgent,
} from "@/app/api/__generated__/endpoints/graphs/graphs";
import { useDeleteV1DeleteExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { okData } from "@/app/api/helpers";
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
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  schedule: GraphExecutionJobInfo;
  onDeleted?: () => void;
  onRunCreated?: (runID: string) => void;
}

export function ScheduleActionsDropdown({
  agent,
  schedule,
  onDeleted,
  onRunCreated,
}: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeleteV1DeleteExecutionSchedule();

  const { mutateAsync: executeAgent, isPending: isRunning } =
    usePostV1ExecuteGraphAgent();

  async function handleDelete() {
    try {
      await deleteSchedule({ scheduleId: schedule.id });

      toast({ title: t("Schedule deleted", "计划已删除") });
      setShowDeleteDialog(false);

      onDeleted?.();

      invalidateAllScheduleQueries(queryClient, agent.graph_id);
    } catch (error: unknown) {
      toast({
        title: "Failed to delete schedule",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  async function handleRunNow(e: React.MouseEvent) {
    e.stopPropagation();

    try {
      toast({ title: "Run started" });

      const res = await executeAgent({
        graphId: schedule.graph_id,
        graphVersion: schedule.graph_version,
        data: {
          inputs: schedule.input_data || {},
          credentials_inputs: schedule.input_credentials || {},
          source: "library",
        },
      });

      const newRunID = okData(res)?.id;

      await queryClient.invalidateQueries({
        queryKey: getGetV1ListGraphExecutionsQueryKey(agent.graph_id),
      });

      if (newRunID) {
        onRunCreated?.(newRunID);
      }
    } catch (error: unknown) {
      toast({
        title: "Failed to start run",
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
          <DropdownMenuItem onClick={handleRunNow} disabled={isRunning}>
            {isRunning ? "Running..." : t("Run now", "立即运行")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            {t("Delete schedule", "删除计划")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete schedule", "删除计划")}
      >
        <Dialog.Content>
          <div>
            <Text variant="large">
              {t(
                "Are you sure you want to delete this schedule? This action cannot be undone.",
                "确定要删除此计划吗？此操作无法撤销。",
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
                {t("Delete Schedule", "删除计划")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetV1ListGraphExecutionsQueryKey,
  getV1GetGraphVersion,
  useDeleteV1DeleteGraphExecution,
} from "@/app/api/__generated__/endpoints/graphs/graphs";
import {
  getGetV2ListLibraryAgentsQueryKey,
  useDeleteV2DeleteLibraryAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import {
  getGetV1ListExecutionSchedulesForAGraphQueryOptions,
  useDeleteV1DeleteExecutionSchedule,
} from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { GraphExecution } from "@/app/api/__generated__/models/graphExecution";
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
import { exportAsJSONFile } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  scheduleId?: string;
  run?: GraphExecution;
  agentGraphId?: string;
  onClearSelectedRun?: () => void;
}

export function AgentActionsDropdown({
  agent,
  run,
  agentGraphId,
  scheduleId,
  onClearSelectedRun,
}: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { mutateAsync: deleteAgent } = useDeleteV2DeleteLibraryAgent();

  const { mutateAsync: deleteRun, isPending: isDeletingRun } =
    useDeleteV1DeleteGraphExecution();

  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteRunDialog, setShowDeleteRunDialog] = useState(false);

  const { mutateAsync: deleteSchedule } = useDeleteV1DeleteExecutionSchedule();
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [showDeleteScheduleDialog, setShowDeleteScheduleDialog] =
    useState(false);

  async function handleDeleteAgent() {
    if (!agent.id) return;

    setIsDeletingAgent(true);

    try {
      await deleteAgent({ libraryAgentId: agent.id });

      await queryClient.refetchQueries({
        queryKey: getGetV2ListLibraryAgentsQueryKey(),
      });

      toast({ title: "Workflow deleted" });
      setShowDeleteDialog(false);
      router.push("/library");
    } catch (error: unknown) {
      toast({
        title: "Failed to delete workflow",
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    } finally {
      setIsDeletingAgent(false);
    }
  }

  async function handleExport() {
    try {
      const res = await getV1GetGraphVersion(
        agent.graph_id,
        agent.graph_version,
        { for_export: true },
      );
      if (res.status === 200) {
        const filename = `${agent.name}_v${agent.graph_version}.json`;
        exportAsJSONFile(res.data as any, filename);
        toast({ title: "Workflow exported" });
      } else {
        toast({ title: "Failed to export workflow", variant: "destructive" });
      }
    } catch (e: any) {
      toast({
        title: "Failed to export workflow",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteRun() {
    if (!run?.id || !agentGraphId) return;

    try {
      await deleteRun({ graphExecId: run.id });

      toast({ title: "Task deleted" });

      await queryClient.refetchQueries({
        queryKey: getGetV1ListGraphExecutionsQueryKey(agentGraphId),
      });

      if (onClearSelectedRun) onClearSelectedRun();

      setShowDeleteRunDialog(false);
    } catch (error: unknown) {
      toast({
        title: "Failed to delete task",
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  async function handleDeleteSchedule() {
    setIsDeletingSchedule(true);
    try {
      await deleteSchedule({ scheduleId: scheduleId ?? "" });
      toast({ title: t("Schedule deleted", "计划已删除") });

      await queryClient.invalidateQueries({
        queryKey: getGetV1ListExecutionSchedulesForAGraphQueryOptions(
          agentGraphId ?? "",
        ).queryKey,
      });

      setShowDeleteDialog(false);
    } catch (error: unknown) {
      toast({
        title: "Failed to delete schedule",
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    } finally {
      setIsDeletingSchedule(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="icon"
            size="icon"
            aria-label={t("More actions", "更多操作")}
            className="min-w-fit"
          >
            <Icon icon={MoreHorizontalIcon} size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {run ? (
            <>
              <DropdownMenuItem onClick={() => setShowDeleteRunDialog(true)}>
                {t("Delete this task", "删除此任务")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem asChild>
            <Link
              href={`/build?flowID=${agent.graph_id}&flowVersion=${agent.graph_version}`}
              target="_blank"
              className="flex items-center gap-2"
            >
              {t("Edit workflow", "编辑工作流")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            {t("Export workflow to file", "将工作流导出为文件")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            {t("Delete workflow", "删除工作流")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        controlled={{
          isOpen: showDeleteRunDialog,
          set: setShowDeleteRunDialog,
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
                onClick={() => setShowDeleteRunDialog(false)}
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

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete workflow", "删除工作流")}
      >
        <Dialog.Content>
          <div>
            <Text variant="large">
              {t(
                "Are you sure you want to delete this workflow? This action cannot be undone.",
                "确定要删除此工作流吗？此操作无法撤销。",
              )}
            </Text>
            <Dialog.Footer>
              <Button
                variant="secondary"
                disabled={isDeletingAgent}
                onClick={() => setShowDeleteDialog(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAgent}
                loading={isDeletingAgent}
              >
                {t("Delete Workflow", "删除工作流")}
              </Button>
            </Dialog.Footer>
          </div>
        </Dialog.Content>
      </Dialog>

      <Dialog
        controlled={{
          isOpen: showDeleteScheduleDialog,
          set: setShowDeleteScheduleDialog,
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
                disabled={isDeletingSchedule}
                onClick={() => setShowDeleteScheduleDialog(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSchedule}
                loading={isDeletingSchedule}
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

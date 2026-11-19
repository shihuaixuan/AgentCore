"use client";

import {
  getGetV1ListGraphExecutionsQueryKey,
  usePostV1ExecuteGraphAgent,
  usePostV1StopGraphExecution,
} from "@/app/api/__generated__/endpoints/graphs/graphs";
import {
  getGetV2ListPresetsQueryKey,
  usePostV2CreateANewPreset,
} from "@/app/api/__generated__/endpoints/presets/presets";
import type { GraphExecution } from "@/app/api/__generated__/models/graphExecution";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { okData } from "@/app/api/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Params {
  agentGraphId: string;
  run?: GraphExecution;
  agent?: LibraryAgent;
  onSelectRun?: (id: string) => void;
}

export function useSelectedRunActions({
  agentGraphId,
  run,
  agent,
  onSelectRun,
}: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] =
    useState(false);

  const canStop = run?.status === "RUNNING" || run?.status === "QUEUED";

  const canRunManually = !agent?.trigger_setup_info;

  const { mutateAsync: stopRun, isPending: isStopping } =
    usePostV1StopGraphExecution();

  const { mutateAsync: executeRun, isPending: isRunningAgain } =
    usePostV1ExecuteGraphAgent();

  const { mutateAsync: createPreset, isPending: isCreatingTemplate } =
    usePostV2CreateANewPreset();

  async function handleStopRun() {
    try {
      await stopRun({
        graphId: run?.graph_id ?? "",
        graphExecId: run?.id ?? "",
      });

      toast({ title: t("Run stopped", "运行已停止") });

      await queryClient.invalidateQueries({
        queryKey: getGetV1ListGraphExecutionsQueryKey(agentGraphId),
      });
    } catch (error: unknown) {
      toast({
        title: t("Failed to stop run", "无法停止运行"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  async function handleRunAgain() {
    if (!run) {
      toast({
        title: t("Run not found", "未找到运行记录"),
        description: t("Run not found", "未找到运行记录"),
        variant: "destructive",
      });
      return;
    }

    try {
      toast({ title: t("Run started", "运行已开始") });

      const res = await executeRun({
        graphId: run.graph_id,
        graphVersion: run.graph_version,
        data: {
          inputs: run.inputs || {},
          credentials_inputs: run.credential_inputs || {},
          source: "library",
        },
      });

      const newRunId = okData(res)?.id;

      await queryClient.invalidateQueries({
        queryKey: getGetV1ListGraphExecutionsQueryKey(agentGraphId),
      });

      if (newRunId && onSelectRun) onSelectRun(newRunId);
    } catch (error: unknown) {
      toast({
        title: t("Failed to start run", "无法开始运行"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  function handleShowDeleteDialog(open: boolean) {
    setShowDeleteDialog(open);
  }

  async function handleCreateTemplate(name: string, description: string) {
    if (!run) {
      toast({
        title: t("Run not found", "未找到运行记录"),
        description: t(
          "Cannot create template from missing run",
          "无法从不存在的运行记录创建模板",
        ),
        variant: "destructive",
      });
      return;
    }

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
          title: t("Template created", "模板已创建"),
        });

        if (agent) {
          queryClient.invalidateQueries({
            queryKey: getGetV2ListPresetsQueryKey({
              graph_id: agent.graph_id,
            }),
          });
        }

        setIsCreateTemplateModalOpen(false);
      }
    } catch (error: unknown) {
      toast({
        title: t("Failed to create template", "无法创建模板"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  // Open in builder URL helper
  const openInBuilderHref = run
    ? `/build?flowID=${run.graph_id}&flowVersion=${run.graph_version}&flowExecutionID=${run.id}`
    : undefined;

  return {
    openInBuilderHref,
    showDeleteDialog,
    canStop,
    isStopping,
    canRunManually,
    isRunningAgain,
    handleShowDeleteDialog,
    handleStopRun,
    handleRunAgain,
    handleCreateTemplate,
    isCreatingTemplate,
    isCreateTemplateModalOpen,
    setIsCreateTemplateModalOpen,
  } as const;
}

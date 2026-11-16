"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { GraphExecution } from "@/app/api/__generated__/models/graphExecution";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { AgentActionsDropdown } from "../../../AgentActionsDropdown";
import { SelectedActionsWrap } from "../../../SelectedActionsWrap";
import { ShareRunButton } from "../../../ShareRunButton/ShareRunButton";
import { CreateTemplateModal } from "../CreateTemplateModal/CreateTemplateModal";
import { useSelectedRunActions } from "./useSelectedRunActions";
import {
  Album01Icon,
  CornerLeftUpIcon,
  CornerRightDownIcon,
  EyeIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  agent: LibraryAgent;
  run: GraphExecution | undefined;
  onSelectRun?: (id: string) => void;
  onClearSelectedRun?: () => void;
};

export function SelectedRunActions({
  agent,
  run,
  onSelectRun,
  onClearSelectedRun,
}: Props) {
  const { t } = useTranslation();
  const {
    canRunManually,
    handleRunAgain,
    handleStopRun,
    isRunningAgain,
    canStop,
    isStopping,
    openInBuilderHref,
    handleCreateTemplate,
    isCreateTemplateModalOpen,
    setIsCreateTemplateModalOpen,
  } = useSelectedRunActions({
    agentGraphId: agent.graph_id,
    run: run,
    agent: agent,
    onSelectRun: onSelectRun,
  });

  const isRunning = run?.status === "RUNNING";

  if (!run || !agent) return null;

  return (
    <SelectedActionsWrap>
      {canRunManually && !isRunning ? (
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Rerun task", "重新运行任务")}
          onClick={handleRunAgain}
          disabled={isRunningAgain}
        >
          {isRunningAgain ? (
            <LoadingSpinner size="small" />
          ) : (
            <div className="relative flex flex-col items-center justify-center">
              <Icon
                icon={CornerLeftUpIcon}
                size={16}
                className="relative bottom-[4px] z-0 rotate-90"
              />
              <Icon
                icon={CornerRightDownIcon}
                size={16}
                className="absolute bottom-[-5px] z-10 rotate-90"
              />
            </div>
          )}
        </Button>
      ) : null}
      {canStop ? (
        <Button
          variant="destructive"
          size="icon"
          aria-label={t("Stop task", "停止任务")}
          onClick={handleStopRun}
          disabled={isStopping}
        >
          <Icon icon={StopIcon} size={18} />
        </Button>
      ) : null}
      {openInBuilderHref ? (
        <Button
          variant="icon"
          size="icon"
          as="NextLink"
          href={openInBuilderHref}
          target="_blank"
          aria-label={t("View task details", "查看任务详情")}
        >
          <Icon icon={EyeIcon} size={18} />
        </Button>
      ) : null}
      <ShareRunButton
        graphId={agent.graph_id}
        executionId={run.id}
        isShared={run.is_shared}
        shareToken={run.share_token}
      />
      {canRunManually && (
        <>
          <Button
            variant="icon"
            size="icon"
            aria-label={t("Save task as template", "将任务保存为模板")}
            onClick={() => setIsCreateTemplateModalOpen(true)}
            title={t("Create template", "创建模板")}
          >
            <Icon icon={Album01Icon} size={18} />
          </Button>
          <CreateTemplateModal
            isOpen={isCreateTemplateModalOpen}
            onClose={() => setIsCreateTemplateModalOpen(false)}
            onCreate={handleCreateTemplate}
            run={run}
          />
        </>
      )}
      <AgentActionsDropdown
        agent={agent}
        run={run}
        agentGraphId={agent.graph_id}
        onClearSelectedRun={onClearSelectedRun}
      />
    </SelectedActionsWrap>
  );
}

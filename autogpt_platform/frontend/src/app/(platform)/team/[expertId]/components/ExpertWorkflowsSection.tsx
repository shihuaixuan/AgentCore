"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ExpertWorkflowRef } from "@/app/api/__generated__/models/expertWorkflowRef";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Calendar03Icon,
  GridViewIcon,
  ListViewIcon,
  PlayIcon,
  PlusSignIcon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useState } from "react";
import {
  filterExpertWorkflows,
  WORKFLOW_FILTERS,
  WorkflowFilter,
} from "../../helpers";
import { ExpertWorkflowCard } from "./ExpertWorkflowCard";
import { ExpertWorkflowListItem } from "./ExpertWorkflowListItem";
import { useExpertWorkflowAgents } from "./useExpertWorkflowAgents";
import { useExpertWorkflowsView } from "./useExpertWorkflowsView";
import { ViewToggle } from "./ViewToggle";
import { SectionEmptyState } from "../../components/SectionEmptyState";
import { ToolbarSearch } from "../../components/ToolbarSearch";
import { PillFilterMenu } from "../../components/PillFilterMenu";

interface Props {
  expertName: string;
  workflows: ExpertWorkflowRef[];
  expertId?: string;
  coverColor?: string;
  emptyMessage?: string;
  onInstallWorkflow?: () => void;
  onAskWorkflow?: (prompt: string) => void;
}

export function ExpertWorkflowsSection({
  expertName,
  workflows,
  expertId,
  coverColor,
  emptyMessage,
  onInstallWorkflow,
  onAskWorkflow,
}: Props) {
  const { t } = useTranslation();
  const viewOptions = [
    { value: "list", label: t("List view", "列表视图"), icon: ListViewIcon },
    { value: "grid", label: t("Grid view", "网格视图"), icon: GridViewIcon },
  ] as const;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WorkflowFilter>("all");
  const { view, setView } = useExpertWorkflowsView();
  const visible = filterExpertWorkflows(workflows, query, filter);
  const agentsByID = useExpertWorkflowAgents(workflows);

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <Text variant="large-medium" tone="primary">
          {t(`${expertName}'s Workflows`, `${expertName} 的工作流`)}
        </Text>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {onInstallWorkflow ? (
            <Button
              variant="secondary"
              size="small"
              textSize="body-md"
              leadingIcon={PlusSignIcon}
              onClick={onInstallWorkflow}
            >
              {t("Install workflow", "安装工作流")}
            </Button>
          ) : null}
          <ToolbarSearch
            textSize="body-md"
            id="expert-workflows-search"
            label={t("Search workflows", "搜索工作流")}
            value={query}
            onChange={setQuery}
          />
          <PillFilterMenu
            textSize="body-md"
            label={t("Filter workflows", "筛选工作流")}
            value={filter}
            defaultValue="all"
            options={WORKFLOW_FILTERS}
            onChange={setFilter}
          />
          <ViewToggle value={view} options={viewOptions} onChange={setView} />
        </div>
      </div>
      {workflows.length === 0 ? (
        <SectionEmptyState
          tiles={[
            <span key="flow" className="inline-flex text-sky">
              <Icon icon={WorkflowSquare01Icon} size={22} />
            </span>,
            <span key="play" className="inline-flex text-orange">
              <Icon icon={PlayIcon} size={22} />
            </span>,
            <span key="calendar" className="inline-flex text-brand">
              <Icon icon={Calendar03Icon} size={22} />
            </span>,
          ]}
          title={t("No workflows yet", "暂无工作流")}
          description={
            emptyMessage ??
            t(
              `Install a workflow to give ${expertName} something to run.`,
              `安装工作流，让 ${expertName} 可以执行任务。`,
            )
          }
        >
          {onInstallWorkflow ? (
            <Button
              variant="primary"
              size="small"
              textSize="body-md"
              leadingIcon={PlusSignIcon}
              onClick={onInstallWorkflow}
            >
              {t("Install workflow", "安装工作流")}
            </Button>
          ) : null}
        </SectionEmptyState>
      ) : visible.length === 0 ? (
        <Text variant="body-md" tone="muted">
          {t("No workflows match.", "没有匹配的工作流。")}
        </Text>
      ) : view === "list" ? (
        <div className="flex flex-col gap-3 pt-4" data-testid="workflow-list">
          {visible.map((workflow) => (
            <ExpertWorkflowListItem
              key={workflow.id}
              workflow={workflow}
              libraryAgent={agentsByID.get(workflow.library_agent_id ?? "")}
              expertId={expertId}
              onAsk={onAskWorkflow}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((workflow) => (
            <ExpertWorkflowCard
              key={workflow.id}
              workflow={workflow}
              libraryAgent={agentsByID.get(workflow.library_agent_id ?? "")}
              expertId={expertId}
              coverColor={coverColor}
              onAsk={onAskWorkflow}
            />
          ))}
        </div>
      )}
    </section>
  );
}

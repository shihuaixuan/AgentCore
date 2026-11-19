"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { WorkflowTile } from "./components/WorkflowTile";
import { INSTALL_WORKFLOW_SOURCES, workflowSubtitle } from "./helpers";
import { useInstallWorkflowPicker } from "./useInstallWorkflowPicker";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

interface Props {
  mode: "pick-expert" | "pick-workflow";
  storeListingVersionId?: string;
  expertId?: string;
  open: boolean;
  onClose: () => void;
}

export function InstallWorkflowPicker({
  mode,
  storeListingVersionId,
  expertId,
  open,
  onClose,
}: Props) {
  const { t, locale } = useTranslation();
  const {
    title,
    hiredExperts,
    source,
    setSource,
    searchQuery,
    setSearchQuery,
    libraryResults,
    hasMoreLibraryResults,
    loadMoreLibraryResults,
    isLoadingMore,
    marketplaceResults,
    isSearching,
    pendingKey,
    installOnExpert,
    installLibraryAgent,
    installFromListing,
  } = useInstallWorkflowPicker({
    mode,
    storeListingVersionId,
    expertId,
    open,
    onClose,
  });

  const isEmpty =
    source === "library"
      ? libraryResults.length === 0
      : marketplaceResults.length === 0;

  return (
    <Dialog
      title={title}
      variant="compact"
      styling={{ width: "480px", maxHeight: "70vh" }}
      controlled={{
        isOpen: open,
        set: (nextOpen) => {
          if (!nextOpen) onClose();
        },
      }}
    >
      <Dialog.Content>
        {mode === "pick-expert" ? (
          hiredExperts.length === 0 ? (
            <Text
              variant="body"
              data-slot="install-workflow-picker-empty"
              tone="muted"
            >
              {t("No hired experts yet.", "尚未聘用专家。")}
            </Text>
          ) : (
            <div
              data-slot="install-workflow-picker-list"
              className="divide-y divide-separator overflow-hidden rounded-lg border border-border-base/80"
            >
              {hiredExperts.map((expert) => {
                const expertTitle = getExpertDisplayTitle(expert, locale);
                return (
                  <div
                    key={expert.id}
                    data-slot="install-workflow-picker-option"
                    className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-muted"
                  >
                    <ExpertAvatar
                      name={expertTitle}
                      avatarUrl={expert.avatar_url}
                      size={36}
                    />
                    <div
                      data-slot="install-workflow-picker-option-text"
                      className="min-w-0 flex-1"
                    >
                      <Text
                        variant="body-medium"
                        data-slot="install-workflow-picker-option-title"
                        className="truncate"
                      >
                        {expertTitle}
                      </Text>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      data-slot="install-workflow-picker-option-install"
                      loading={pendingKey === expert.id}
                      onClick={() => installOnExpert(expert)}
                    >
                      {t("Install", "安装")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div
            data-slot="install-workflow-picker"
            className="flex flex-col gap-3"
          >
            <div
              data-slot="install-workflow-picker-sources"
              className="flex gap-2"
              role="group"
              aria-label={t("Workflow source", "工作流来源")}
            >
              {INSTALL_WORKFLOW_SOURCES.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant="toggle"
                  size="xs"
                  data-slot="install-workflow-picker-source"
                  aria-pressed={source === option.id}
                  onClick={() => setSource(option.id)}
                >
                  {t(
                    option.label,
                    option.id === "library" ? "你的工作流" : "市场",
                  )}
                </Button>
              ))}
            </div>
            <Input
              id="install-workflow-search"
              size="small"
              label={t("Search workflows", "搜索工作流")}
              hideLabel
              placeholder={
                source === "library"
                  ? t("Search your workflows", "搜索你的工作流")
                  : t("Search the marketplace", "搜索市场")
              }
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              wrapperClassName="!mb-0"
              data-slot="install-workflow-picker-search"
            />
            {isSearching ? (
              <div className="py-2">
                <Text
                  variant="small"
                  data-slot="install-workflow-picker-status"
                  tone="muted"
                  align="center"
                >
                  {t("Searching…", "正在搜索……")}
                </Text>
              </div>
            ) : isEmpty ? (
              <div className="py-2">
                <Text
                  variant="small"
                  data-slot="install-workflow-picker-empty"
                  tone="muted"
                  align="center"
                >
                  {source === "library"
                    ? t(
                        "No workflows in your library.",
                        "你的工作流库中还没有工作流。",
                      )
                    : t("No workflows found.", "未找到工作流。")}
                </Text>
              </div>
            ) : (
              <div
                data-slot="install-workflow-picker-list"
                className="divide-y divide-separator overflow-hidden rounded-lg border border-border-base/80"
              >
                {source === "library"
                  ? libraryResults.map((agent) => (
                      <div
                        key={agent.id}
                        data-testid="install-workflow-option"
                        data-slot="install-workflow-picker-option"
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-muted"
                      >
                        <WorkflowTile imageUrl={agent.image_url} />
                        <div
                          data-slot="install-workflow-picker-option-text"
                          className="min-w-0 flex-1"
                        >
                          <Text
                            variant="body-medium"
                            data-slot="install-workflow-picker-option-title"
                            className="truncate"
                          >
                            {agent.name}
                          </Text>
                          <Text
                            variant="small"
                            data-slot="install-workflow-picker-option-subtitle"
                            tone="muted"
                            className="truncate"
                          >
                            {agent.description?.trim()
                              ? workflowSubtitle(agent.description)
                              : t("From your library", "来自你的工作流库")}
                          </Text>
                        </div>
                        <Button
                          variant="secondary"
                          size="small"
                          data-slot="install-workflow-picker-option-install"
                          loading={pendingKey === agent.id}
                          onClick={() => installLibraryAgent(agent)}
                        >
                          {t("Install", "安装")}
                        </Button>
                      </div>
                    ))
                  : marketplaceResults.map((agent) => (
                      <div
                        key={agent.agent_graph_id}
                        data-testid="install-workflow-option"
                        data-slot="install-workflow-picker-option"
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-muted"
                      >
                        <WorkflowTile imageUrl={agent.agent_image} />
                        <div
                          data-slot="install-workflow-picker-option-text"
                          className="min-w-0 flex-1"
                        >
                          <Text
                            variant="body-medium"
                            data-slot="install-workflow-picker-option-title"
                            className="truncate"
                          >
                            {agent.agent_name}
                          </Text>
                          <Text
                            variant="small"
                            data-slot="install-workflow-picker-option-subtitle"
                            tone="muted"
                          >
                            {t(`by ${agent.creator}`, `作者：${agent.creator}`)}
                          </Text>
                        </div>
                        <Button
                          variant="secondary"
                          size="small"
                          data-slot="install-workflow-picker-option-install"
                          loading={pendingKey === agent.agent_graph_id}
                          onClick={() => installFromListing(agent)}
                        >
                          {t("Install", "安装")}
                        </Button>
                      </div>
                    ))}
              </div>
            )}
            {source === "library" && hasMoreLibraryResults ? (
              <Button
                variant="secondary"
                size="small"
                loading={isLoadingMore}
                data-slot="install-workflow-picker-load-more"
                onClick={() => loadMoreLibraryResults()}
              >
                {t("Load more workflows", "加载更多工作流")}
              </Button>
            ) : null}
          </div>
        )}
      </Dialog.Content>
    </Dialog>
  );
}

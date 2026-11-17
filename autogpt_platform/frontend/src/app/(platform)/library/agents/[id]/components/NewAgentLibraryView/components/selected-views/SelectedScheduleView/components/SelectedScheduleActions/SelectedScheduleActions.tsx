"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { AgentActionsDropdown } from "../../../AgentActionsDropdown";
import { SelectedActionsWrap } from "../../../SelectedActionsWrap";
import { EditScheduleModal } from "../EditScheduleModal/EditScheduleModal";
import { useSelectedScheduleActions } from "./useSelectedScheduleActions";
import { Delete02Icon, EyeIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  agent: LibraryAgent;
  scheduleId: string;
  schedule?: GraphExecutionJobInfo;
  onDeleted?: () => void;
  onSelectRun?: (id: string) => void;
};

export function SelectedScheduleActions({
  agent,
  scheduleId,
  schedule,
  onDeleted,
  onSelectRun,
}: Props) {
  const { t } = useTranslation();
  const {
    openInBuilderHref,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
    isDeleting,
    handleRunNow,
    isRunning,
  } = useSelectedScheduleActions({
    agent,
    scheduleId,
    schedule,
    onDeleted,
    onSelectRun,
  });

  return (
    <>
      <SelectedActionsWrap>
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Run now", "立即运行")}
          onClick={handleRunNow}
          disabled={isRunning || !schedule}
        >
          {isRunning ? (
            <LoadingSpinner size="small" />
          ) : (
            <Icon icon={PlayIcon} size={18} />
          )}
        </Button>
        {openInBuilderHref && (
          <Button
            variant="icon"
            size="icon"
            as="NextLink"
            href={openInBuilderHref}
            target="_blank"
            aria-label={t("View scheduled task details", "查看计划任务详情")}
          >
            <Icon icon={EyeIcon} size={18} />
          </Button>
        )}
        {schedule && (
          <EditScheduleModal
            graphId={agent.graph_id}
            schedule={schedule}
            iconOnly
          />
        )}
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Delete schedule", "删除计划")}
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <LoadingSpinner size="small" />
          ) : (
            <Icon icon={Delete02Icon} size={18} />
          )}
        </Button>
        <AgentActionsDropdown agent={agent} scheduleId={scheduleId} />
      </SelectedActionsWrap>

      <Dialog
        controlled={{
          isOpen: showDeleteDialog,
          set: setShowDeleteDialog,
        }}
        styling={{ maxWidth: "32rem" }}
        title={t("Delete schedule", "删除计划")}
      >
        <Dialog.Content>
          <Text variant="large">
            {t(
              "Are you sure you want to delete this schedule? This action cannot be undone.",
              "确定要删除此计划吗？此操作无法撤销。",
            )}
          </Text>
          <Dialog.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
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
        </Dialog.Content>
      </Dialog>
    </>
  );
}

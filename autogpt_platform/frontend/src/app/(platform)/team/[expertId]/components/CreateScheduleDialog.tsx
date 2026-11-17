"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useGetV2GetLibraryAgent } from "@/app/api/__generated__/endpoints/library/library";
import { ExpertWorkflowRef } from "@/app/api/__generated__/models/expertWorkflowRef";
import { okData } from "@/app/api/helpers";
import { RunAgentModal } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentModal/RunAgentModal";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { useCreateScheduleDialog } from "./useCreateScheduleDialog";
import { useFitListToDialog } from "./useFitListToDialog";

interface Props {
  expertId: string;
  workflows: ExpertWorkflowRef[];
  open: boolean;
  onClose: () => void;
}

export function CreateScheduleDialog({
  expertId,
  workflows,
  open,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { handleScheduleCreated } = useCreateScheduleDialog(expertId, onClose);
  const schedulable = workflows.filter((workflow) => workflow.library_agent_id);
  const { attachList } = useFitListToDialog<HTMLUListElement>();

  return (
    <Dialog
      variant="compact"
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next) onClose();
        },
      }}
      styling={{ maxWidth: "28rem", maxHeight: "60vh" }}
      title={t("Create schedule", "创建计划")}
    >
      <Dialog.Content>
        <div className="flex flex-col">
          {schedulable.length === 0 ? (
            <Text variant="body" tone="secondary">
              {t(
                "Install a workflow first, then schedule it here.",
                "先安装工作流，再在这里设置计划。",
              )}
            </Text>
          ) : (
            <ul
              ref={attachList}
              className="flex flex-col gap-2 overflow-y-auto pr-1"
              aria-label={t("Schedulable workflows", "可设置计划的工作流")}
            >
              {schedulable.map((workflow) => (
                <li key={workflow.id}>
                  <ScheduleWorkflowRow
                    workflow={workflow}
                    onScheduleCreated={handleScheduleCreated}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="small" onClick={onClose}>
              {t("Cancel", "取消")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

interface RowProps {
  workflow: ExpertWorkflowRef;
  onScheduleCreated: () => void;
}

function ScheduleWorkflowRow({ workflow, onScheduleCreated }: RowProps) {
  const { data: agent } = useGetV2GetLibraryAgent(
    workflow.library_agent_id ?? "",
    { query: { select: okData, enabled: Boolean(workflow.library_agent_id) } },
  );
  const name = workflow.name ?? "Unnamed workflow";
  const row = (
    <button
      type="button"
      disabled={!agent}
      className="flex w-full items-center gap-3 rounded-2xl border border-border-base px-4 py-3 text-left transition-colors hover:bg-surface-muted disabled:opacity-60"
    >
      <span className="inline-flex shrink-0 text-foreground-tertiary">
        <Icon icon={Calendar03Icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <Text
          variant="body-medium"
          as="span"
          tone="primary"
          className="block truncate"
        >
          {name}
        </Text>
        {workflow.description ? (
          <Text
            variant="small"
            as="span"
            tone="muted"
            className="block truncate"
          >
            {workflow.description}
          </Text>
        ) : null}
      </span>
      <span className="inline-flex shrink-0 text-foreground-subtle">
        <Icon icon={ArrowRight01Icon} size={16} />
      </span>
    </button>
  );

  if (!agent) return row;
  return (
    <RunAgentModal
      agent={agent}
      triggerSlot={row}
      onScheduleCreated={onScheduleCreated}
    />
  );
}

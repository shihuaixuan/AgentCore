"use client";

import * as React from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AgentTableCard } from "../AgentTableCard/AgentTableCard";
import { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";
import { AgentTableRow } from "../AgentTableRow/AgentTableRow";
import { StoreSubmissionEditRequest } from "@/app/api/__generated__/models/storeSubmissionEditRequest";

export interface AgentTableProps {
  storeAgentSubmissions: StoreSubmission[];
  onViewSubmission: (submission: StoreSubmission) => void;
  onDeleteSubmission: (submission_id: string) => void;
  onEditSubmission: (
    submission: StoreSubmissionEditRequest & {
      store_listing_version_id: string | undefined;
      graph_id: string;
    },
  ) => void;
}

export const AgentTable: React.FC<AgentTableProps> = ({
  storeAgentSubmissions,
  onViewSubmission,
  onDeleteSubmission,
  onEditSubmission,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full" data-testid="agent-table">
      {/* Table header - Hide on mobile */}
      <div className="hidden flex-col md:flex">
        <div className="border-t border-border-strong" />
        <div className="flex items-center px-4 py-2">
          <div className="grid w-full grid-cols-[minmax(400px,1fr)_180px_140px_100px_100px_40px] items-center gap-4">
            <div className="text-body font-medium text-foreground-emphasis">
              {t("Workflow info", "工作流信息")}
            </div>
            <div className="text-body font-medium text-foreground-emphasis">
              {t("Date submitted", "提交日期")}
            </div>
            <div className="text-body font-medium text-foreground-emphasis">
              {t("Status", "状态")}
            </div>
            <div className="text-right text-body font-medium text-foreground-emphasis">
              {t("Runs", "运行次数")}
            </div>
            <div className="text-right text-body font-medium text-foreground-emphasis">
              {t("Reviews", "评价")}
            </div>
            <div></div>
          </div>
        </div>
        <div className="border-b border-border-strong" />
      </div>

      {/* Table body */}
      {storeAgentSubmissions.length > 0 ? (
        <div className="flex flex-col">
          {storeAgentSubmissions.map((agentSubmission) => (
            <div key={agentSubmission.listing_version_id} className="md:block">
              <AgentTableRow
                storeAgentSubmission={agentSubmission}
                onViewSubmission={onViewSubmission}
                onDeleteSubmission={onDeleteSubmission}
                onEditSubmission={onEditSubmission}
              />
              <div className="block md:hidden">
                <AgentTableCard
                  storeAgentSubmission={agentSubmission}
                  onViewSubmission={onViewSubmission}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center font-sans text-body-lg text-foreground-secondary">
          {t(
            "No workflows available. Create your first workflow to get started!",
            "暂无工作流。创建你的第一个工作流即可开始！",
          )}
        </div>
      )}
    </div>
  );
};

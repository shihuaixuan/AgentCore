"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useMainDashboardPage } from "./useMainDashboardPage";
import { Separator } from "@/components/atoms/Separator/Separator";
import { AgentTable } from "../AgentTable/AgentTable";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import { EditAgentModal } from "@/components/contextual/EditAgentModal/EditAgentModal";
import { Button } from "@/components/atoms/Button/Button";
import { EmptySubmissions } from "./components/EmptySubmissions";
import { SubmissionLoadError } from "./components/SumbmissionLoadError";
import { SubmissionsLoading } from "./components/SubmissionsLoading";
import { Text } from "@/components/atoms/Text/Text";

export const MainDashboardPage = () => {
  const { t } = useTranslation();
  const {
    onDeleteSubmission,
    onViewSubmission,
    onEditSubmission,
    onEditSuccess,
    onEditClose,
    onOpenSubmitModal,
    onPublishStateChange,
    publishState,
    editState,
    // API data
    submissions,
    isLoading,
    error,
  } = useMainDashboardPage();

  return (
    <main className="flex-1 py-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-6">
          <Text variant="h1" size="h3">
            {t("Workflow dashboard", "工作流面板")}
          </Text>
          <div className="space-y-2">
            <Text variant="h2" size="large-medium" tone="primary">
              {t("Submit a New Workflow", "提交新工作流")}
            </Text>
            <Text variant="body" size="small">
              {t(
                "Select from the list of workflows you currently have, or upload from your local machine.",
                "从已有工作流中选择，或从本机上传。",
              )}
            </Text>
          </div>
        </div>
        <PublishAgentModal
          targetState={publishState}
          onStateChange={onPublishStateChange}
          trigger={
            <Button
              data-testid="submit-agent-button"
              size="small"
              onClick={onOpenSubmitModal}
            >
              {t("Submit workflow", "提交工作流")}
            </Button>
          }
        />
      </div>

      <Separator className="mb-8" />

      {/* Agents Section */}
      <div>
        <Text variant="h2" size="large-medium" tone="primary" className="mb-4">
          {t("Your uploaded workflows", "你上传的工作流")}
        </Text>

        {error ? (
          <SubmissionLoadError />
        ) : isLoading ? (
          <SubmissionsLoading />
        ) : submissions && submissions.submissions.length > 0 ? (
          <AgentTable
            storeAgentSubmissions={submissions.submissions}
            onViewSubmission={onViewSubmission}
            onDeleteSubmission={onDeleteSubmission}
            onEditSubmission={onEditSubmission}
          />
        ) : (
          <EmptySubmissions />
        )}
      </div>

      <EditAgentModal
        isOpen={editState.isOpen}
        onClose={onEditClose}
        submission={editState.submission}
        onSuccess={onEditSuccess}
      />
    </main>
  );
};

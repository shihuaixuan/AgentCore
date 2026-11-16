"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Input } from "@/components/atoms/Input/Input";
import { CredentialsInput } from "@/components/contextual/CredentialsInput/CredentialsInput";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { getErrorStatus } from "../../../helpers";
import { TriggerNotFound } from "../../other/TriggerNotFound";
import {
  getAgentCredentialsFields,
  getAgentInputFields,
  getTriggerConfigFields,
} from "../../modals/AgentInputsReadOnly/helpers";
import { RunAgentInputs } from "../../modals/RunAgentInputs/RunAgentInputs";
import { LoadingSelectedContent } from "../LoadingSelectedContent";
import { RunDetailCard } from "../RunDetailCard/RunDetailCard";
import { RunDetailHeader } from "../RunDetailHeader/RunDetailHeader";
import { WebhookTriggerCard } from "../SelectedTemplateView/components/WebhookTriggerCard";
import { SelectedViewLayout } from "../SelectedViewLayout";
import { SelectedTriggerActions } from "./components/SelectedTriggerActions";
import { useSelectedTriggerView } from "./useSelectedTriggerView";

interface Props {
  agent: LibraryAgent;
  triggerId: string;
  onClearSelectedRun?: () => void;
  onSwitchToRunsTab?: () => void;
  banner?: React.ReactNode;
}

export function SelectedTriggerView({
  agent,
  triggerId,
  onClearSelectedRun,
  onSwitchToRunsTab,
  banner,
}: Props) {
  const { t } = useTranslation();
  const {
    trigger,
    isLoading,
    error,
    name,
    setName,
    description,
    setDescription,
    inputs,
    setInputValue,
    triggerConfig,
    setTriggerConfigValue,
    credentials,
    setCredentialValue,
    handleSaveChanges,
    isSaving,
  } = useSelectedTriggerView({
    triggerId,
    graphId: agent.graph_id,
  });

  const agentInputFields = getAgentInputFields(agent);
  const agentCredentialsFields = getAgentCredentialsFields(agent);
  const inputFields = Object.entries(agentInputFields);
  const triggerConfigFields = Object.entries(getTriggerConfigFields(agent));
  const credentialFields = Object.entries(agentCredentialsFields);

  if (getErrorStatus(error) === 404) {
    return (
      <TriggerNotFound
        agent={agent}
        banner={banner}
        onClearSelection={onClearSelectedRun}
      />
    );
  }

  if (error) {
    return (
      <ErrorCard
        responseError={
          error
            ? {
                message: String(
                  (error as unknown as { message?: string })?.message ||
                    "Failed to load trigger",
                ),
              }
            : undefined
        }
        httpError={
          (error as any)?.status
            ? {
                status: (error as any).status,
                statusText: (error as any).statusText,
              }
            : undefined
        }
        context="trigger"
      />
    );
  }

  if (isLoading && !trigger) {
    return <LoadingSelectedContent agent={agent} />;
  }

  if (!trigger) {
    return null;
  }

  const hasWebhook = !!trigger.webhook_id && trigger.webhook;

  return (
    <div className="flex h-full w-full gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SelectedViewLayout agent={agent} banner={banner}>
          <div className="flex flex-col gap-4">
            <RunDetailHeader agent={agent} run={undefined} />

            <RunDetailCard title={t("Trigger Details", "触发器详情")}>
              <div className="flex flex-col gap-2">
                <Input
                  id="trigger-name"
                  label={t("Name", "名称")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Enter trigger name", "输入触发器名称")}
                />

                <Input
                  id="trigger-description"
                  label={t("Description", "描述")}
                  type="textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("Enter trigger description", "输入触发器描述")}
                />
              </div>
            </RunDetailCard>

            {hasWebhook && agent.trigger_setup_info && (
              <WebhookTriggerCard
                template={trigger}
                triggerSetupInfo={agent.trigger_setup_info}
              />
            )}

            {triggerConfigFields.length > 0 && (
              <RunDetailCard title={t("Trigger Configuration", "触发器配置")}>
                <div className="flex flex-col gap-4">
                  {triggerConfigFields.map(([key, inputSubSchema]) => (
                    <RunAgentInputs
                      key={key}
                      schema={inputSubSchema}
                      value={triggerConfig[key] ?? inputSubSchema.default}
                      placeholder={inputSubSchema.description}
                      onChange={(value) => setTriggerConfigValue(key, value)}
                    />
                  ))}
                </div>
              </RunDetailCard>
            )}

            {inputFields.length > 0 && (
              <RunDetailCard title={t("Your Input", "你的输入")}>
                <div className="flex flex-col gap-4">
                  {inputFields.map(([key, inputSubSchema]) => (
                    <RunAgentInputs
                      key={key}
                      schema={inputSubSchema}
                      value={inputs[key] ?? inputSubSchema.default}
                      placeholder={inputSubSchema.description}
                      onChange={(value) => setInputValue(key, value)}
                    />
                  ))}
                </div>
              </RunDetailCard>
            )}

            {credentialFields.length > 0 && (
              <RunDetailCard title={t("Task Credentials", "任务凭据")}>
                <div className="flex flex-col gap-6">
                  {credentialFields.map(([key, inputSubSchema]) => (
                    <CredentialsInput
                      key={key}
                      schema={
                        { ...inputSubSchema, discriminator: undefined } as any
                      }
                      selectedCredentials={
                        credentials[key] ?? inputSubSchema.default
                      }
                      onSelectCredentials={(value) =>
                        setCredentialValue(key, value!)
                      }
                      siblingInputs={{ ...inputs, ...triggerConfig }}
                    />
                  ))}
                </div>
              </RunDetailCard>
            )}
          </div>
        </SelectedViewLayout>
      </div>
      {trigger ? (
        <div className="-mt-2 max-w-[3.75rem] flex-shrink-0">
          <SelectedTriggerActions
            agent={agent}
            triggerId={trigger.id}
            onDeleted={onClearSelectedRun}
            onSaveChanges={handleSaveChanges}
            isSaving={isSaving}
            onSwitchToRunsTab={onSwitchToRunsTab}
          />
        </div>
      ) : null}
    </div>
  );
}

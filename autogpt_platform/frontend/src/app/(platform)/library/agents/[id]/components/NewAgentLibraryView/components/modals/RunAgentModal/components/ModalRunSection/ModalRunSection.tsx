"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/atoms/Input/Input";
import { CredentialsGroupedView } from "@/components/contextual/CredentialsInput/components/CredentialsGroupedView/CredentialsGroupedView";
import { InformationTooltip } from "@/components/molecules/InformationTooltip/InformationTooltip";
import { useMemo } from "react";
import { RunAgentInputs } from "../../../RunAgentInputs/RunAgentInputs";
import { useRunAgentModalContext } from "../../context";
import { ModalSection } from "../ModalSection/ModalSection";
import { WebhookTriggerBanner } from "../WebhookTriggerBanner/WebhookTriggerBanner";

export function ModalRunSection() {
  const { t } = useTranslation();
  const {
    agent,
    defaultRunType,
    presetName,
    setPresetName,
    presetDescription,
    setPresetDescription,
    inputValues,
    setInputValue,
    agentInputFields,
    triggerConfigValues,
    setTriggerConfigValue,
    triggerConfigFields,
    agentCredentialsInputFields,
    inputCredentials,
    setInputCredentialsValue,
  } = useRunAgentModalContext();

  const triggerConfigFieldEntries = Object.entries(triggerConfigFields || {});
  const inputFields = Object.entries(agentInputFields || {});

  const credentialFields = useMemo(() => {
    if (!agentCredentialsInputFields) return [];
    return Object.entries(agentCredentialsInputFields);
  }, [agentCredentialsInputFields]);

  const requiredCredentials = new Set(
    (agent.credentials_input_schema?.required as string[]) || [],
  );

  return (
    <div className="flex flex-col gap-4">
      {defaultRunType === "automatic-trigger" ||
      defaultRunType === "manual-trigger" ? (
        <ModalSection
          title={t("Task Trigger", "任务触发器")}
          subtitle="Set up a trigger for the workflow to run this task automatically"
        >
          <WebhookTriggerBanner />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col space-y-2">
              <label className="flex items-center gap-1 text-body font-medium">
                {t("Trigger Name", "触发器名称")}
                <InformationTooltip
                  description={t(
                    "Name of the trigger you are setting up",
                    "要设置的触发器名称",
                  )}
                />
              </label>
              <Input
                id="trigger_name"
                label={t("Trigger Name", "触发器名称")}
                size="small"
                hideLabel
                value={presetName}
                placeholder={t("Enter trigger name", "输入触发器名称")}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center gap-1 text-body font-medium">
                {t("Trigger Description", "触发器描述")}
                <InformationTooltip
                  description={t(
                    "Description of the trigger you are setting up",
                    "要设置的触发器描述",
                  )}
                />
              </label>
              <Input
                id="trigger_description"
                label={t("Trigger Description", "触发器描述")}
                size="small"
                hideLabel
                value={presetDescription}
                placeholder={t("Enter trigger description", "输入触发器描述")}
                onChange={(e) => setPresetDescription(e.target.value)}
              />
            </div>
          </div>
        </ModalSection>
      ) : null}

      {triggerConfigFieldEntries.length > 0 ? (
        <ModalSection
          title={t("Trigger Configuration", "触发器配置")}
          subtitle="Configure what this trigger listens for"
        >
          {triggerConfigFieldEntries.map(([key, inputSubSchema]) => (
            <RunAgentInputs
              key={key}
              schema={inputSubSchema}
              value={triggerConfigValues[key] ?? inputSubSchema.default}
              placeholder={inputSubSchema.description}
              onChange={(value) => setTriggerConfigValue(key, value)}
              data-testid={`trigger-config-${key}`}
            />
          ))}
        </ModalSection>
      ) : null}

      {inputFields.length > 0 ? (
        <ModalSection
          title={t("Task Inputs", "任务输入")}
          subtitle="Enter the information you want to provide to the workflow for this task"
        >
          {inputFields.map(([key, inputSubSchema]) => (
            <RunAgentInputs
              key={key}
              schema={inputSubSchema}
              value={inputValues[key] ?? inputSubSchema.default}
              placeholder={inputSubSchema.description}
              onChange={(value) => setInputValue(key, value)}
              data-testid={`agent-input-${key}`}
            />
          ))}
        </ModalSection>
      ) : null}

      {credentialFields.length > 0 ? (
        <ModalSection
          title={t("Task Credentials", "任务凭据")}
          subtitle="These are the credentials the workflow will use to perform this task"
        >
          <CredentialsGroupedView
            credentialFields={credentialFields}
            requiredCredentials={requiredCredentials}
            inputCredentials={inputCredentials}
            inputValues={inputValues}
            onCredentialChange={setInputCredentialsValue}
          />
        </ModalSection>
      ) : null}
    </div>
  );
}

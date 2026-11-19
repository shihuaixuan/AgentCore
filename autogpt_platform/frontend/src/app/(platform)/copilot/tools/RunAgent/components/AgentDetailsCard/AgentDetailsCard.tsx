"use client";

import type { AgentDetailsResponse } from "@/app/api/__generated__/models/agentDetailsResponse";
import { Button } from "@/components/atoms/Button/Button";
import { FormRenderer } from "@/components/renderers/InputRenderer/FormRenderer";
import { useEffect, useState } from "react";
import { useCopilotChatActions } from "../../../../components/CopilotChatActionsProvider/useCopilotChatActions";
import { ContentMessage } from "../../../../components/ToolAccordion/AccordionContent";
import { buildInputSchema, extractDefaults, isFormValid } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  output: AgentDetailsResponse;
}

export function AgentDetailsCard({ output }: Props) {
  const { t } = useTranslation();
  const { onSend } = useCopilotChatActions();
  const schema = buildInputSchema(output.agent.inputs);

  const defaults = schema ? extractDefaults(schema) : {};

  const [inputValues, setInputValues] =
    useState<Record<string, unknown>>(defaults);
  const [valid, setValid] = useState(() =>
    schema ? isFormValid(schema, defaults) : false,
  );

  // Reset form state when the agent changes (e.g. during mid-conversation switches)
  useEffect(() => {
    const newSchema = buildInputSchema(output.agent.inputs);
    const newDefaults = newSchema ? extractDefaults(newSchema) : {};
    setInputValues(newDefaults);
    setValid(newSchema ? isFormValid(newSchema, newDefaults) : false);
  }, [output.agent.id]);

  function handleChange(v: { formData?: Record<string, unknown> }) {
    const data = v.formData ?? {};
    setInputValues(data);
    if (schema) {
      setValid(isFormValid(schema, data));
    }
  }

  function handleProceed() {
    const nonEmpty = Object.fromEntries(
      Object.entries(inputValues).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    onSend(
      `Run the workflow "${output.agent.name}" with these inputs: ${JSON.stringify(nonEmpty, null, 2)}`,
    );
  }

  if (output.agent.trigger_info) {
    // Informational only — no action button. run_agent hands off to
    // setup_agent_webhook_trigger (whose own card collects config/credentials
    // and shows the result), so a "Set up trigger" button here would be
    // redundant and, once setup has succeeded, a stale backward-pointing CTA.
    return (
      <ContentMessage>
        {t(
          "This workflow runs on a webhook trigger, so it can't be run or scheduled directly — it's activated by setting up its trigger.",
          "此工作流由 Webhook 触发，无法直接运行或安排计划，需设置触发器后激活。",
        )}
      </ContentMessage>
    );
  }

  if (!schema) {
    return (
      <div className="grid gap-2">
        <ContentMessage>
          {t(
            "This workflow has no configurable inputs.",
            "此工作流没有可配置的输入。",
          )}
        </ContentMessage>
        <div className="flex gap-2 pt-2">
          <Button
            size="small"
            className="w-fit"
            onClick={() =>
              onSend(
                `Run the workflow "${output.agent.name}" with placeholder/example values so I can test it.`,
              )
            }
          >
            {t("Proceed", "继续")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <ContentMessage>
        {t(
          "Review the inputs below and press Proceed to run.",
          "检查下方输入，然后点击“继续”运行。",
        )}
      </ContentMessage>

      <div className="mt-2 rounded-2xl border bg-canvas p-3 pt-4">
        <FormRenderer
          jsonSchema={schema}
          handleChange={handleChange}
          uiSchema={{
            "ui:submitButtonOptions": { norender: true },
          }}
          initialValues={inputValues}
          formContext={{
            showHandles: false,
            size: "small",
          }}
        />
      </div>

      <div className="mt-4">
        <Button
          variant="primary"
          size="small"
          className="w-fit"
          disabled={!valid}
          onClick={handleProceed}
        >
          {t("Proceed", "继续")}
        </Button>
      </div>
    </div>
  );
}

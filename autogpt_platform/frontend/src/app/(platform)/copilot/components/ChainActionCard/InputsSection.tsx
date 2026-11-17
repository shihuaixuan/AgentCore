"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Icon } from "@/components/atoms/Icon/Icon";
import { FormRenderer } from "@/components/renderers/InputRenderer/FormRenderer";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { formatInputsTitle, type InputsRequest } from "./helpers";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  requests: InputsRequest[];
}

/** One card per block/agent asking for inputs, titled by its name so two
 *  blocks' forms never blend into one table. */
export function InputsSection({ requests }: Props) {
  const { t } = useTranslation();
  const visible = requests.filter(
    (request) => request.schema !== null || request.hasAdvanced,
  );
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((request) => (
        <div
          key={request.id}
          className="overflow-hidden rounded-3xl border border-separator bg-surface"
        >
          <div className="flex items-center gap-2.5 border-b border-separator px-4 py-3">
            <Icon icon={PencilEdit02Icon} size={18} tone="subtle" />
            <Text variant="body-medium-tight" as="span" tone="primary">
              {request.title
                ? formatInputsTitle(request.title)
                : t("Fill in the details", "填写详细信息")}
            </Text>
            {request.title && (
              <Text
                variant="small-tight"
                as="span"
                tone="subtle"
                className="ml-auto"
              >
                {t("Fill in the details", "填写详细信息")}
              </Text>
            )}
          </div>

          {/* Each RJSF field carries an inline 16px bottom margin — the
              negative margin swallows the last field's so the card edge
              sits ~8px below the form. */}
          <div className="px-4 pt-2 pb-0">
            {request.schema && (
              <FormRenderer
                jsonSchema={request.schema}
                className="mt-0 -mb-2"
                handleChange={(v) => request.onChange(v.formData ?? {})}
                uiSchema={{
                  "ui:submitButtonOptions": { norender: true },
                }}
                initialValues={request.values}
                formContext={{
                  showHandles: false,
                  size: "small",
                }}
              />
            )}
            {request.hasAdvanced && (
              <button
                type="button"
                className="mt-1 mb-2 text-caption text-foreground-tertiary underline"
                onClick={request.onToggleAdvanced}
              >
                {request.showAdvanced
                  ? t("Hide advanced fields", "隐藏高级字段")
                  : t("Show advanced fields", "显示高级字段")}
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

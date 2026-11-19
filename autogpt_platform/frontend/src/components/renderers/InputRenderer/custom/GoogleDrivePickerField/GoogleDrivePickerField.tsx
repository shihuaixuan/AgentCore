import { BlockUIType } from "@/app/(platform)/build/components/types";
import { GoogleDrivePickerInput } from "@/components/contextual/GoogleDrivePicker/GoogleDrivePickerInput";
import { GoogleDrivePickerConfig } from "@/lib/autogpt-server-api";
import { FieldProps, getTemplate, getUiOptions, titleId } from "@rjsf/utils";
import { cleanUpHandleId, getHandleId, updateUiOption } from "../../helpers";
import { useEdgeStore } from "@/app/(platform)/build/stores/edgeStore";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const GoogleDrivePickerField = (props: FieldProps) => {
  const { t } = useTranslation();
  const { schema, uiSchema, onChange, fieldPathId, formData, registry } = props;
  const uiOptions = getUiOptions(uiSchema);
  const config: GoogleDrivePickerConfig = schema.google_drive_picker_config;

  const { nodeId } = registry.formContext;
  const uiType = registry.formContext?.uiType;

  const TitleFieldTemplate = getTemplate("TitleFieldTemplate", registry);

  const handleId = getHandleId({ uiOptions, id: fieldPathId.$id, schema });
  const updatedUiSchema = updateUiOption(uiSchema, {
    handleId,
    showHandles: !!nodeId,
  });

  const { isInputConnected } = useEdgeStore();
  const isConnected = isInputConnected(nodeId, cleanUpHandleId(handleId));

  if (uiType === BlockUIType.INPUT) {
    return (
      <div className="flex flex-col gap-2">
        {!isConnected && (
          <div className="rounded-3xl border border-border-base p-2 pl-4 text-caption text-foreground-tertiary hover:cursor-not-allowed">
            {t(
              "Select files when you run the workflow",
              "运行工作流时选择文件",
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TitleFieldTemplate
        id={titleId(fieldPathId.$id)}
        title={schema.title || ""}
        required={false}
        schema={schema}
        uiSchema={updatedUiSchema}
        registry={registry}
      />
      {!isConnected && (
        <GoogleDrivePickerInput
          config={config}
          value={formData}
          onChange={(value) => onChange(value, fieldPathId.path)}
          className={uiOptions.className}
          showRemoveButton={true}
        />
      )}
    </div>
  );
};

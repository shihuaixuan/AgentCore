import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { builderFieldError } from "../../utils/builder-validation";

export const FieldError = ({
  nodeId,
  fieldId,
  id,
  isBuilderNode,
}: {
  nodeId: string;
  fieldId: string;
  id?: string;
  isBuilderNode?: boolean;
}) => {
  const { locale } = useTranslation();
  const nodeErrors = useNodeStore((state) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    return node?.data?.errors;
  });
  const fieldError =
    nodeErrors?.[fieldId] || nodeErrors?.[fieldId.replace(/_%_/g, ".")] || null;

  return (
    <div id={id} aria-live="polite" aria-atomic="true">
      {fieldError && (
        <div className="mt-1 pl-4">
          <Text variant="small" tone="danger">
            {isBuilderNode && locale === "zh-CN"
              ? builderFieldError(fieldError)
              : fieldError}
          </Text>
        </div>
      )}
    </div>
  );
};

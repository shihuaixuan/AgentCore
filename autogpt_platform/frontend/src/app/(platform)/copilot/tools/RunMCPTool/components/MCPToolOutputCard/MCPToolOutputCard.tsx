"use client";

import {
  ContentCard,
  ContentCardTitle,
  ContentCodeBlock,
  ContentGrid,
  ContentMessage,
} from "../../../../components/ToolAccordion/AccordionContent";
import type { MCPToolOutputResponse } from "../../helpers";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  output: MCPToolOutputResponse;
}

interface ImageResult {
  type: "image";
  data: string;
  mimeType: string;
}

function isImageResult(value: unknown): value is ImageResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).type === "image" &&
    typeof (value as Record<string, unknown>).data === "string" &&
    typeof (value as Record<string, unknown>).mimeType === "string"
  );
}

function formatResult(value: unknown, emptyLabel: string): string {
  if (value === null || value === undefined) return emptyLabel;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function MCPToolOutputCard({ output }: Props) {
  const { t } = useTranslation();
  const result = output.result;

  const isImage = isImageResult(result);
  const resultText = isImage
    ? ""
    : formatResult(result, t("(no result)", "（无结果）"));
  const isJson =
    !isImage &&
    result !== null &&
    result !== undefined &&
    typeof result !== "string";

  return (
    <ContentGrid>
      <ContentMessage>{output.message}</ContentMessage>

      <ContentCard>
        <ContentCardTitle size="small">{output.tool_name}</ContentCardTitle>

        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- a base64 data URL from the tool output
          <img
            src={`data:${result.mimeType};base64,${result.data}`}
            alt={t(
              `Result from ${output.tool_name}`,
              `来自 ${output.tool_name} 的结果`,
            )}
            className="mt-2 max-h-96 max-w-full rounded object-contain"
          />
        ) : isJson ? (
          <ContentCodeBlock className="mt-2 max-h-96 overflow-y-auto">
            {resultText}
          </ContentCodeBlock>
        ) : (
          <Text
            variant="body-tight"
            tone="emphasis"
            className="mt-2 max-h-96 overflow-y-auto break-words whitespace-pre-wrap"
          >
            {resultText}
          </Text>
        )}
      </ContentCard>
    </ContentGrid>
  );
}

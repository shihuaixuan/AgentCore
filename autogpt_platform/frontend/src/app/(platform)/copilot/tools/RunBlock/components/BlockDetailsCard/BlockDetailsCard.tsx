"use client";

import type { BlockDetailsResponse } from "../../helpers";
import {
  ContentBadge,
  ContentCard,
  ContentCardDescription,
  ContentCardTitle,
  ContentGrid,
  ContentMessage,
} from "../../../../components/ToolAccordion/AccordionContent";
import { deriveFieldTitle } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  output: BlockDetailsResponse;
}

function SchemaFieldList({
  title,
  properties,
  required,
}: {
  title: string;
  properties: Record<string, unknown>;
  required?: string[];
}) {
  const { t } = useTranslation();
  const entries = Object.entries(properties);
  if (entries.length === 0) return null;

  const requiredSet = new Set(required ?? []);

  return (
    <ContentCard>
      <ContentCardTitle size="small">{title}</ContentCardTitle>
      <div className="mt-2 grid gap-2">
        {entries.map(([name, schema]) => {
          const field = schema as Record<string, unknown> | undefined;
          const fieldTitle =
            typeof field?.title === "string"
              ? field.title
              : deriveFieldTitle(name);
          const fieldType =
            typeof field?.type === "string" ? field.type : t("unknown", "未知");
          const description =
            typeof field?.description === "string"
              ? field.description
              : undefined;

          return (
            <div key={name} className="rounded-xl border p-2">
              <div className="flex items-center justify-between gap-2">
                <ContentCardTitle size="small">{fieldTitle}</ContentCardTitle>
                <div className="flex gap-1">
                  <ContentBadge>{fieldType}</ContentBadge>
                  {requiredSet.has(name) && (
                    <ContentBadge>{t("Required", "必填")}</ContentBadge>
                  )}
                </div>
              </div>
              {description && (
                <ContentCardDescription size="small" className="mt-1">
                  {description}
                </ContentCardDescription>
              )}
            </div>
          );
        })}
      </div>
    </ContentCard>
  );
}

export function BlockDetailsCard({ output }: Props) {
  const { t } = useTranslation();
  const inputs = output.block.inputs as {
    properties?: Record<string, unknown>;
    required?: string[];
  } | null;
  const outputs = output.block.outputs as {
    properties?: Record<string, unknown>;
    required?: string[];
  } | null;

  return (
    <ContentGrid>
      <ContentMessage>{output.message}</ContentMessage>

      {inputs?.properties && Object.keys(inputs.properties).length > 0 && (
        <SchemaFieldList
          title={t("Inputs", "输入")}
          properties={inputs.properties}
          required={inputs.required}
        />
      )}

      {outputs?.properties && Object.keys(outputs.properties).length > 0 && (
        <SchemaFieldList
          title={t("Outputs", "输出")}
          properties={outputs.properties}
          required={outputs.required}
        />
      )}
    </ContentGrid>
  );
}

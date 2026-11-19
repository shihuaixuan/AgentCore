"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { BlockOutputResponse } from "@/app/api/__generated__/models/blockOutputResponse";
import {
  globalRegistry,
  OutputItem,
} from "@/components/contextual/OutputRenderers";
import { resolveForRenderer } from "@/app/(platform)/copilot/tools/ViewAgentOutput/ViewAgentOutput";
import {
  ContentBadge,
  ContentCard,
  ContentCardTitle,
  ContentGrid,
  ContentMessage,
} from "../../../../components/ToolAccordion/AccordionContent";

interface Props {
  output: BlockOutputResponse;
}

const COLLAPSED_LIMIT = 3;

function RenderOutputValue({ value }: { value: unknown }) {
  const resolved = resolveForRenderer(value);
  const renderer = globalRegistry.getRenderer(
    resolved.value,
    resolved.metadata,
  );

  if (renderer) {
    return (
      <OutputItem
        value={resolved.value}
        metadata={resolved.metadata}
        renderer={renderer}
      />
    );
  }

  return null;
}

function OutputKeySection({
  outputKey,
  items,
}: {
  outputKey: string;
  items: unknown[];
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasMoreItems = items.length > COLLAPSED_LIMIT;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_LIMIT);

  return (
    <ContentCard>
      <div className="flex items-center justify-between gap-2">
        <ContentCardTitle size="small">{outputKey}</ContentCardTitle>
        <ContentBadge>
          {t(
            `${items.length} item${items.length === 1 ? "" : "s"}`,
            `${items.length} 项`,
          )}
        </ContentBadge>
      </div>
      <div className="mt-2">
        {visibleItems.map((item, i) => (
          <RenderOutputValue key={i} value={item} />
        ))}
      </div>
      {hasMoreItems && (
        <Button
          variant="ghost-muted"
          size="small"
          className="mt-1 h-auto px-0 py-0.5 text-caption-sm leading-inherit"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? t("Show less", "收起")
            : t(
                `Show all ${items.length} items`,
                `显示全部 ${items.length} 项`,
              )}
        </Button>
      )}
    </ContentCard>
  );
}

export function BlockOutputCard({ output }: Props) {
  const { t } = useTranslation();
  return (
    <ContentGrid>
      {output.is_dry_run && (
        <div className="flex items-center gap-1.5 rounded-md border border-warning-border bg-warning-surface px-2.5 py-1.5 text-caption font-medium text-warning-foreground">
          <span>⚡</span>
          <span>
            {t(
              "Simulated — no real execution occurred",
              "模拟结果 — 未实际执行",
            )}
          </span>
        </div>
      )}
      <ContentMessage>{output.message}</ContentMessage>

      {Object.entries(output.outputs ?? {}).map(([key, items]) => (
        <OutputKeySection key={key} outputKey={key} items={items} />
      ))}
    </ContentGrid>
  );
}

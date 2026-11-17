"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { StoreAgent } from "@/app/api/__generated__/models/storeAgent";
import { Button } from "@/components/atoms/Button/Button";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import { useState } from "react";
import { SectionHeader } from "../SectionHeader";
import { SHELF_GRID, SHELF_PREVIEW_SIZE } from "../Shelf/helpers";
import { ShelfMoreButton } from "../Shelf/ShelfMoreButton";
import { WorkflowTile } from "./components/WorkflowTile";
import { featuredFirst } from "./helpers";

const HEADING_ID = "workflows-heading";

interface Props {
  id: string;
  agents: StoreAgent[];
  featuredAgents: StoreAgent[];
  total: number;
  onPublish?: () => void;
}

export function WorkflowsShelf({
  id,
  agents,
  featuredAgents,
  total,
  onPublish,
}: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const ordered = featuredFirst(agents, featuredAgents);

  if (ordered.length === 0) return null;

  const shown = isExpanded ? ordered : ordered.slice(0, SHELF_PREVIEW_SIZE);
  const publishTrigger = (
    <Button variant="secondary" size="small" onClick={onPublish}>
      {t("Publish your workflows", "发布你的工作流")}
    </Button>
  );

  return (
    <section
      id={id}
      aria-labelledby={HEADING_ID}
      className="mb-16 scroll-mt-24"
    >
      <SectionHeader
        title={t("Workflows", "工作流")}
        titleId={HEADING_ID}
        subtitle={t(
          "Automations your experts can run — or install one yourself.",
          "供你的专家运行的自动化工作流，你也可以自行安装。",
        )}
      />
      <ul className={SHELF_GRID}>
        {shown.map((agent) => (
          <WorkflowTile key={agent.agent_graph_id} agent={agent} />
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {ordered.length > SHELF_PREVIEW_SIZE ? (
          <ShelfMoreButton
            isExpanded={isExpanded}
            count={ordered.length}
            isAll={total <= ordered.length}
            noun="workflows"
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        ) : null}
        {/* The old full-width creator banner sat at the bottom of the page and
            spoke louder than the shelf it advertised; one line under the
            workflows is the whole invitation. */}
        {onPublish ? (
          publishTrigger
        ) : (
          <PublishAgentModal trigger={publishTrigger} />
        )}
      </div>
    </section>
  );
}

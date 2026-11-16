"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AiEraserIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { HomeDashboardResponse } from "@/app/api/__generated__/models/homeDashboardResponse";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { formatWeeklySpend } from "../../helpers";
import { HomeTileEmpty } from "../HomeTileEmpty/HomeTileEmpty";
import { HomeTile } from "../HomeTile/HomeTile";
import { AgentRow } from "./components/AgentRow";

// The tile lists this many experts; past that, its link offers the rest.
const LISTED_EXPERTS = 3;

interface Props {
  dashboard: HomeDashboardResponse;
  className?: string;
}

export function AgentTeam({ dashboard, className }: Props) {
  const { t } = useTranslation();
  const { team, agents } = dashboard;
  const teamSpend = formatWeeklySpend(team.spend_cents);
  const statusLine =
    team.working > 0
      ? `${team.working} working now · ${team.ready} ready`
      : `${team.ready} ready for work`;

  return (
    <HomeTile
      className={className}
      icon={AiEraserIcon}
      title={t("Your team", "你的团队")}
      meta={
        team.total > 0 ? (
          <span className="tabular-nums">
            {teamSpend ? `${statusLine} · ${teamSpend}` : statusLine}
          </span>
        ) : null
      }
    >
      {agents.length === 0 ? (
        <HomeTileEmpty
          title={t("Build your team", "组建团队")}
          description={t(
            "Hire an expert to start delegating work.",
            "聘用专家，开始委派工作。",
          )}
          action={{
            href: "/marketplace",
            label: t("Browse experts", "浏览专家"),
          }}
        />
      ) : (
        <div className="divide-y divide-separator">
          {agents.slice(0, LISTED_EXPERTS).map((agent) => (
            <AgentRow key={agent.expert.id} agent={agent} />
          ))}
        </div>
      )}

      {team.total > 0 ? (
        <Link
          href="/team"
          className="group flex items-center justify-between border-t border-separator px-4 py-2 transition-colors outline-none hover:bg-surface-muted focus-visible:bg-surface-muted"
        >
          <Text
            variant="small-medium"
            as="span"
            tone="muted"
            motion="colors"
            className="group-hover:text-foreground-strong"
          >
            {team.total > LISTED_EXPERTS
              ? `View all ${team.total} experts`
              : "Open team"}
          </Text>
          <Icon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </HomeTile>
  );
}

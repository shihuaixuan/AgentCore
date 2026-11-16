"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useReducedMotion } from "framer-motion";
import { TeamBranch } from "./TeamBranch";
import { TeamNode } from "./TeamNode";
import { TEAM, TEAM_PARENTS } from "./teamSceneHelpers";

export function TeamScene() {
  const { t } = useTranslation();
  const animate = !useReducedMotion();

  return (
    <div className="@container relative isolate mx-auto h-[396px] w-full max-w-[600px]">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 h-3/4 w-4/5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-surface blur-3xl"
      />
      {TEAM_PARENTS.map((parent) => (
        <TeamBranch key={parent.asset} parent={parent} animate={animate} />
      ))}
      <ul
        role="list"
        aria-label={t("Your team", "你的团队")}
        className="absolute inset-0"
      >
        {TEAM.map((member) => (
          <TeamNode key={member.asset} member={member} animate={animate} />
        ))}
      </ul>
    </div>
  );
}

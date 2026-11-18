"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SessionSummaryResponse } from "@/app/api/__generated__/models/sessionSummaryResponse";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { ExpertIdentityDetails } from "@/components/molecules/ExpertIdentityDetails/ExpertIdentityDetails";
import {
  CollapsibleRoot,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/molecules/Collapsible/Collapsible";
import { SidebarMenu } from "@/components/molecules/Sidebar/Sidebar";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { ReactNode, useState } from "react";
import { EXPERT_CHAT_PAGE_SIZE } from "@/services/experts/expert-chat-pagination";

// Otto opens with a short preview and a single "Load all"; every other
// expert starts collapsed and pages in when opened.
const OTTO_PREVIEW_COUNT = 1;

interface Props {
  label: string;
  role?: string | null;
  avatarUrl: string | null;
  color?: string | null;
  isAutopilot?: boolean;
  sessions: SessionSummaryResponse[];
  renderItem: (session: SessionSummaryResponse) => ReactNode;
}

export function ExpertChatGroup({
  label,
  role,
  avatarUrl,
  color,
  isAutopilot,
  sessions,
  renderItem,
}: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(!!isAutopilot);
  const [visibleCount, setVisibleCount] = useState(
    isAutopilot ? OTTO_PREVIEW_COUNT : EXPERT_CHAT_PAGE_SIZE,
  );
  const visibleSessions = sessions.slice(0, visibleCount);
  const hasHiddenSessions = sessions.length > visibleSessions.length;
  const runningSessions = sessions.filter((session) => session.is_processing);

  return (
    <CollapsibleRoot
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/expert-group"
    >
      <div className="group/expert-header relative mb-1 flex items-center rounded-md hover:bg-surface-hover">
        <CollapsibleTrigger
          aria-label={t(`${label} chats`, `${label}的对话`)}
          // The size and weight reach ManagedExpertImage's fallback initials (a
          // span that sets its colour, not its size or weight), and the weight
          // ExpertAvatar's initial; every other piece of copy is a toned Text.
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-body leading-5 font-medium max-md:py-2 max-md:text-body-lg max-md:leading-6"
        >
          <ExpertGroupIdentity
            label={label}
            role={role}
            avatarUrl={avatarUrl}
            color={color}
            isAutopilot={isAutopilot}
            nameAccessory={<SessionCount count={sessions.length} />}
          />
          <Icon
            icon={ArrowDown01Icon}
            tone="subtle"
            className="ml-auto size-5 shrink-0 transition-[opacity,transform] duration-200 group-focus-within/expert-header:opacity-100 group-hover/expert-header:opacity-100 group-data-[state=open]/expert-group:rotate-180 motion-reduce:transition-none md:opacity-0"
          />
        </CollapsibleTrigger>
      </div>

      {!isOpen && runningSessions.length > 0 && (
        <GroupBody>
          <SidebarMenu>{runningSessions.map(renderItem)}</SidebarMenu>
        </GroupBody>
      )}

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <GroupBody>
          <SidebarMenu>{visibleSessions.map(renderItem)}</SidebarMenu>
          {hasHiddenSessions && (
            <button
              type="button"
              aria-label={t(
                `${isAutopilot ? "Load all" : "Load more"} ${label} chats`,
                `${isAutopilot ? "加载全部" : "加载更多"}${label}的对话`,
              )}
              onClick={() =>
                setVisibleCount((count) =>
                  isAutopilot ? Infinity : count + EXPERT_CHAT_PAGE_SIZE,
                )
              }
              className="mt-0.5 w-full rounded-md px-2 py-1 text-left text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-emphasis max-md:py-2.5"
            >
              <Text
                as="span"
                variant="small-medium-tight-touch"
                tone="inherit"
                className="block"
              >
                {isAutopilot
                  ? t("Load all", "加载全部")
                  : t("Load more", "加载更多")}
              </Text>
            </button>
          )}
        </GroupBody>
      </CollapsibleContent>
    </CollapsibleRoot>
  );
}

interface IdentityProps {
  label: string;
  role?: string | null;
  avatarUrl: string | null;
  color?: string | null;
  isAutopilot?: boolean;
  nameAccessory: ReactNode;
}

/** Avatar, name and role of a group header; shared with NewExpertGroup so a
 *  new expert's entry looks the same before and after their first chat. */
export function ExpertGroupIdentity({
  label,
  role,
  avatarUrl,
  color,
  isAutopilot,
  nameAccessory,
}: IdentityProps) {
  return (
    <>
      {isAutopilot ? (
        <AutopilotAvatar
          size={32}
          transparent
          className="rounded-full border border-border-base"
        />
      ) : (
        <ExpertAvatar
          name={label}
          avatarUrl={avatarUrl}
          color={color}
          size={32}
          className="rounded-full border border-border-base"
        />
      )}
      <ExpertIdentityDetails
        isOtto={isAutopilot}
        name={label}
        role={role}
        size="compact"
        areaClassName="opacity-70"
        nameAccessory={nameAccessory}
      />
    </>
  );
}

function SessionCount({ count }: { count: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-full bg-surface-active/70 px-1.5 text-caption-sm leading-4.5 font-medium text-foreground-secondary tabular-nums"
    >
      {count}
    </span>
  );
}

export function GroupBody({ children }: { children: ReactNode }) {
  return (
    <div className="relative ml-[24px] pl-1.5 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-gradient-to-b before:from-surface-active/70 before:to-transparent">
      {children}
    </div>
  );
}

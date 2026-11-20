"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { Robot01Icon } from "@hugeicons/core-free-icons";
import { useExpertMap } from "../../useExpertMap";
import { SubSessionLink } from "../SubSessionPanel/SubSessionLink";
import { BackgroundSubtaskStop } from "./BackgroundSubtaskStop";
import { HeldApprovalBadge } from "./HeldCallRowParts";
import type { HeldRowInfo } from "./heldRow";
import type { ChainRow } from "./helpers";
import { asObject, str } from "./resultHelpers";
import { useSubSessionEffectiveStatus } from "./SubSessionLive";
import { childSessionID, subSessionTargetRow } from "./subSessionRows";

interface Props {
  row: ChainRow;
  isLast: boolean;
  readOnly: boolean;
}

interface Activity {
  sessionID: string | null;
  name: string;
  avatarURL: string | null;
  color?: string | null;
  status: string;
  named: boolean;
  canStop?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  running: "运行中",
  queued: "排队中",
  completed: "已完成",
  cancelled: "已取消",
  error: "失败",
  failed: "失败",
  transferred: "已移交",
  unconfirmed: "未确认",
  "timed out": "已超时",
  unknown: "状态未知",
};

const identityClass =
  "flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-2 text-left";

export function SubSessionChainRow({ row, isLast, readOnly }: Props) {
  const target = subSessionTargetRow(row);
  const output = asObject(target?.output);
  return output ? (
    <SettledActivity
      output={output}
      held={row.held}
      readOnly={readOnly}
      isLast={isLast}
    />
  ) : (
    <PendingActivity row={target ?? row} readOnly={readOnly} isLast={isLast} />
  );
}

function PendingActivity({ row, readOnly, isLast }: Props) {
  const { t, locale } = useTranslation();
  const args = asObject(row.input) ?? {};
  const expertID = str(args, "expert_id");
  const { expertsById } = useExpertMap(!readOnly && !!expertID);
  const expert = !readOnly && expertID ? expertsById.get(expertID) : null;
  const fallback =
    args.background === true
      ? t("Background subtask", "后台子任务")
      : t("Sub-agent", "子智能体");

  return (
    <ActivityLine
      isLast={isLast}
      activity={{
        sessionID: readOnly ? null : (row.subSessionID ?? null),
        name: expertID ? getExpertDisplayTitle(expert, locale) : fallback,
        avatarURL: expert?.avatarUrl ?? null,
        color: expert?.color,
        status: row.state === "running" ? "running" : "unknown",
        named: !!expert,
      }}
    />
  );
}

function SettledActivity({
  output,
  held,
  readOnly,
  isLast,
}: Omit<Props, "row"> & {
  output: Record<string, unknown>;
  held?: HeldRowInfo;
}) {
  const { t, locale } = useTranslation();
  const expert = asObject(output.expert);
  const name = expert
    ? getExpertDisplayTitle(
        { jobTitle: str(expert, "job_title"), role: str(expert, "role") },
        locale,
      )
    : null;
  const background = !!str(output, "background_task_id");
  const sessionID = readOnly ? null : childSessionID(output);
  const status =
    useSubSessionEffectiveStatus(
      sessionID,
      str(output, "status"),
      background,
    )?.toLowerCase() ?? "unknown";

  return (
    <ActivityLine
      held={held}
      isLast={isLast}
      activity={{
        sessionID,
        name:
          name ??
          (background
            ? t("Background subtask", "后台子任务")
            : t("Sub-agent", "子智能体")),
        avatarURL: expert && str(expert, "avatar_url"),
        color: expert && str(expert, "color"),
        named: !!name,
        status,
        canStop:
          background && ["running", "queued", "unknown"].includes(status),
      }}
    />
  );
}

function ActivityLine({
  activity,
  held,
  isLast,
}: {
  activity: Activity;
  held?: HeldRowInfo;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const { sessionID, name, avatarURL, color, named, status, canStop } =
    activity;
  const identity = (
    <>
      <span
        aria-hidden="true"
        className="flex w-7 shrink-0 items-center justify-center"
      >
        {named ? (
          <ExpertAvatar
            name={name}
            avatarUrl={avatarURL}
            backgroundColor={color ?? undefined}
            size={20}
          />
        ) : (
          <Icon icon={Robot01Icon} size={16} tone="secondary" />
        )}
      </span>
      <Text
        variant="body-sm-medium-inherit"
        as="span"
        tone="emphasis"
        className="truncate"
      >
        {name}
      </Text>
      <Text
        variant="small-tight"
        as="span"
        tone="secondary"
        className="shrink-0"
      >
        {t(status, STATUS_LABELS[status] ?? status)}
      </Text>
    </>
  );

  return (
    <div className={cn("relative", !isLast && "pb-3")}>
      <div className="flex min-h-7 items-center gap-2">
        {sessionID ? (
          <SubSessionLink
            preview={{ sessionID, name, avatarURL, color }}
            className={cn(
              identityClass,
              "transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus",
            )}
          >
            {identity}
          </SubSessionLink>
        ) : (
          <div className={identityClass}>{identity}</div>
        )}
        {held && <HeldApprovalBadge held={held} />}
        {sessionID && canStop && (
          <BackgroundSubtaskStop sessionId={sessionID} />
        )}
      </div>
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute top-7 bottom-0 left-3.5 w-px -translate-x-1/2 bg-surface-active"
        />
      )}
    </div>
  );
}

"use client";

import { taskLabel } from "../taskLabels";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  CollapsibleRoot,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/molecules/Collapsible/Collapsible";
import { cn } from "@/lib/utils";
import {
  ArrowDown01Icon,
  CheckmarkBadge01Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { useId, useState } from "react";
import { EarnGroup, EarnRow, getEarnGroups, TaskGroup } from "../helpers";

interface Props {
  groups: TaskGroup[];
  completedSteps: string[] | undefined;
}

export function WalletEarnCredits({ groups, completedSteps }: Props) {
  const headingID = useId();
  const [open, setOpen] = useState(true);
  const earnGroups = getEarnGroups(groups, completedSteps);
  const available = earnGroups.reduce(
    (total, group) => total + group.amount,
    0,
  );

  return (
    <CollapsibleRoot asChild open={open} onOpenChange={setOpen}>
      <section
        aria-labelledby={headingID}
        className="border-t border-separator"
      >
        <EarnCreditsHeader
          headingID={headingID}
          open={open}
          available={available}
        />
        <CollapsibleContent forceMount hidden={!open} className="px-2 pb-3">
          {earnGroups.map((group) => (
            <EarnGroupSection
              key={`${group.key}:${group.defaultOpen}`}
              group={group}
            />
          ))}
        </CollapsibleContent>
      </section>
    </CollapsibleRoot>
  );
}

function EarnCreditsHeader({
  headingID,
  open,
  available,
}: {
  headingID: string;
  open: boolean;
  available: number;
}) {
  const { t } = useTranslation();
  return (
    <h2 id={headingID}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-foreground-subtle focus-visible:ring-inset"
        >
          <span className="flex w-full items-baseline justify-between gap-3">
            <Text as="span" variant="large-medium" tone="primary">
              {t("Earn credits", "赚取额度")}
            </Text>
            <Text as="span" variant="small" tone="secondary" tabular>
              {available > 0
                ? t(
                    `$${available.toFixed(2)} available`,
                    `可领取 $${available.toFixed(2)}`,
                  )
                : t("All claimed", "已全部领取")}
            </Text>
          </span>
          <span className="flex w-full items-center justify-between gap-3">
            <Text as="span" variant="small" tone="secondary">
              {open
                ? t("Hide onboarding tasks", "收起入门任务")
                : t("Show onboarding tasks", "展开入门任务")}
            </Text>
            <Icon
              icon={ArrowDown01Icon}
              size={16}
              aria-hidden
              tone="muted"
              motion="transform"
              className={cn("shrink-0", open && "rotate-180")}
            />
          </span>
        </button>
      </CollapsibleTrigger>
    </h2>
  );
}

function EarnGroupSection({ group }: { group: EarnGroup }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(group.defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 rounded-large px-3 py-1.5 text-left transition-colors hover:bg-surface-muted"
      >
        <span className="flex min-w-0 items-start gap-2.5">
          <StatusIcon done={group.done} />
          <Text variant="body-medium">
            {t(
              group.label,
              `${taskLabel(group.key)} · ${group.rows.filter((row) => row.done).length}/${group.rows.length}`,
            )}
          </Text>
          <Icon
            icon={ArrowDown01Icon}
            size={14}
            tone="subtle"
            motion="transform"
            className={cn("mt-1 shrink-0", open && "rotate-180")}
          />
        </span>
        <Text variant="body-tight" as="span" tone="muted" className="shrink-0">
          {group.done ? t("Done", "已完成") : `$${group.amount.toFixed(2)}`}
        </Text>
      </button>

      {open && group.rows.map((row) => <EarnTaskRow key={row.key} row={row} />)}
    </div>
  );
}

function EarnTaskRow({ row }: { row: EarnRow }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 pr-3 pl-8">
      <div className="flex min-w-0 items-start gap-2.5">
        <StatusIcon done={row.done} />
        <Text variant="body">{t(row.label, taskLabel(row.label))}</Text>
      </div>
      <Text variant="body-tight" as="span" tone="muted" className="shrink-0">
        {row.done ? t("Done", "已完成") : `$${row.amount.toFixed(2)}`}
      </Text>
    </div>
  );
}

function StatusIcon({ done }: { done: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="mt-0.5 shrink-0">
      {done ? (
        <Icon
          icon={CheckmarkBadge01Icon}
          size={18}
          tone="success"
          aria-label={t("completed", "已完成")}
        />
      ) : (
        <Icon
          icon={CircleIcon}
          size={16}
          tone="subtle"
          aria-label={t("pending", "待完成")}
        />
      )}
    </span>
  );
}

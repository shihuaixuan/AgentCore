"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion } from "framer-motion";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import {
  Clock01Icon,
  Rocket01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

type StepState = "done" | "current" | "upcoming";

interface Step {
  title: string;
  description: string;
  note?: string;
  state: StepState;
  Icon: IconSvgElement;
}

const NODE_CLASS: Record<StepState, string> = {
  done: "bg-success text-action-foreground",
  current:
    "bg-warning-surface text-warning-foreground ring-2 ring-warning-border",
  upcoming: "bg-surface-hover text-foreground-subtle",
};

interface Props {
  shouldReduceMotion: boolean;
}

export function ReviewStepper({ shouldReduceMotion }: Props) {
  const { t } = useTranslation();
  const STEPS: Step[] = [
    {
      title: t("Submitted for review", "已提交审核"),
      description: t(
        "Your listing is queued in the marketplace review pipeline.",
        "您的条目已进入市场审核队列。",
      ),
      state: "done",
      Icon: Tick02Icon,
    },
    {
      title: t("In review", "审核中"),
      description: t(
        "Our team checks the details, media, and safety of your workflow.",
        "我们的团队会检查工作流的详情、媒体内容和安全性。",
      ),
      note: t(
        "Typically reviewed within 2–3 days.",
        "通常在 2–3 天内完成审核。",
      ),
      state: "current",
      Icon: Clock01Icon,
    },
    {
      title: t("Goes live", "上线"),
      description: t(
        "You'll get an email once it's approved. Rejected listings come back with feedback.",
        "获批后您会收到邮件。未获批准的条目会附带审核反馈。",
      ),
      state: "upcoming",
      Icon: Rocket01Icon,
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut", delay: 0.24 }}
      className="mt-6 flex w-full max-w-md flex-col gap-3 px-2"
    >
      <Text variant="body-medium" as="span">
        {t("What happens next", "接下来的流程")}
      </Text>
      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    NODE_CLASS[step.state],
                  )}
                >
                  <Icon icon={step.Icon} size={14} />
                </span>
                {!isLast ? (
                  <span
                    className={cn(
                      "mt-1 min-h-[18px] w-px flex-1",
                      step.state === "done"
                        ? "bg-success/60"
                        : "bg-surface-active",
                    )}
                  />
                ) : null}
              </div>
              <div className={cn("flex min-w-0 flex-col", !isLast && "pb-4")}>
                <Text
                  variant="small-medium"
                  as="span"
                  tone={step.state === "upcoming" ? "subtle" : "base"}
                >
                  {step.title}
                </Text>
                <Text
                  variant="small"
                  tone={step.state === "upcoming" ? "subtle" : "muted"}
                >
                  {step.description}
                </Text>
                {step.note ? (
                  <Text variant="small" tone="warning" className="mt-1">
                    {step.note}
                  </Text>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}

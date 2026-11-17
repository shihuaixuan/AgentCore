"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text/Text";
import { TextGenerateEffect } from "./TextGenerateEffect/TextGenerateEffect";
import { getExpertIntroSuffix } from "../helpers";
import { EditNameDialog } from "./EditNameDialog/EditNameDialog";

interface Props {
  name: string | null;
  /** Null holds the line back (recipient still resolving) without moving
   * the composer below it. */
  intro: string | null;
  recipientPicker?: ReactNode;
  isExpert?: boolean;
  expertRole?: string | null;
}

// The regular empty-session hero. While a greeting is being written
// GreetingLoader renders in its place instead, and its orb travels into
// the intro card's heading under a shared layout id.
export function EmptyHero({
  name,
  intro,
  recipientPicker,
  isExpert,
  expertRole,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-1 flex items-center justify-center gap-3 pt-8 md:pt-0">
        <Text variant="h4" tone="primary">
          {t("Hey", "你好")}
          {name ? (
            <>
              , <span className="text-foreground-strong">{name}</span>
            </>
          ) : (
            t(" there", "")
          )}
          <EditNameDialog currentName={name ?? ""} />
        </Text>
      </div>
      {intro === null ? (
        <div aria-hidden className="mb-8 text-heading-sm leading-normal">
          &nbsp;
        </div>
      ) : recipientPicker ? (
        <div className="mb-8 text-heading-sm leading-relaxed tracking-normal text-foreground-strong">
          {isExpert ? t("I'm", "我是") : t("Tell", "告诉")}{" "}
          <span className="mr-1 inline-block align-middle [&_button]:ml-0 [&_button]:text-lead">
            {recipientPicker}
          </span>
          {isExpert
            ? t(
                getExpertIntroSuffix(expertRole ?? null),
                (expertRole ? "，你的 " + expertRole : "") +
                  "。有什么工作需要我来做？",
              )
            : t(
                " about your work, and it will find what to automate.",
                "你的工作内容，帮你找到可自动化的事项。",
              )}
        </div>
      ) : (
        // Keyed on the text so switching recipient re-types the line.
        <TextGenerateEffect
          key={intro}
          className="mb-8 !font-normal [&_div]:!text-heading-sm [&_div]:!leading-normal [&_div]:!tracking-normal [&>div]:!mt-0"
          duration={0.6}
          words={intro}
        />
      )}
    </>
  );
}

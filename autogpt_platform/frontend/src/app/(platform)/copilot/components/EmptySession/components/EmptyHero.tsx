"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { EditNameDialog } from "./EditNameDialog/EditNameDialog";

interface Props {
  name: string | null;
  /** Null holds the line back (recipient still resolving) without moving
   * the composer below it. */
  intro: string | null;
}

// The regular empty-session hero. While a greeting is being written
// GreetingLoader renders in its place instead, and its orb travels into
// the intro card's heading under a shared layout id.
export function EmptyHero({ name, intro }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-1 flex items-center justify-center gap-3 pt-8 md:pt-0">
        <Text variant="h4" tone="primary">
          {t("Hey", "你好")}
          {name ? (
            <>
              {t(", ", "，")}
              <span className="text-foreground-strong">{name}</span>
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
      ) : (
        <Text as="p" variant="h5" className="mb-8">
          {intro}
        </Text>
      )}
    </>
  );
}

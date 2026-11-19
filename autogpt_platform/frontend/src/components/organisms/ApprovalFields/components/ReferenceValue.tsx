"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Fragment, type ReactNode } from "react";
import { useCardExpertRoster } from "@/components/organisms/PendingReviewsList/useCardExpertRoster";
import type { Reference } from "../helpers";
import { getReferenceIdentity } from "../referenceIdentity";
import { ResolvedReferenceLink } from "./ReferenceLink";

interface Props {
  refs: Reference[];
  // How many ids the argument held; the server names the first few.
  total: number;
  fallback?: ReactNode;
}

export function ReferenceValue({ refs, total, fallback }: Props) {
  const { t, locale } = useTranslation();
  const roster = useCardExpertRoster(false);
  const entries = refs.map((reference) => ({
    reference,
    identity: getReferenceIdentity(reference, locale, roster),
  }));
  if (fallback && !entries.some(({ identity }) => identity.title))
    return fallback;
  const more = total - refs.length;
  return (
    <span data-slot="reference-value">
      {entries.map(({ reference, identity }, index) => (
        <Fragment key={`${reference.id}-${index}`}>
          {index > 0 && ", "}
          {identity.title ? (
            <ResolvedReferenceLink reference={reference} identity={identity}>
              {identity.title}
            </ResolvedReferenceLink>
          ) : (
            <span
              translate="no"
              data-slot="reference-name"
              className="font-mono text-body-sm leading-inherit"
            >
              {reference.id}
            </span>
          )}
        </Fragment>
      ))}
      {more > 0 && (
        <span
          data-slot="reference-value-more"
          className="text-foreground-tertiary"
        >
          {" "}
          {t(`+${more} more`, `还有 ${more} 项`)}
        </span>
      )}
    </span>
  );
}

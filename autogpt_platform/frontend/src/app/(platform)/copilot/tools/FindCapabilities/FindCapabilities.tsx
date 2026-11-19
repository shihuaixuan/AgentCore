"use client";

import { HorizontalScroll } from "@/app/(platform)/build/components/NewControlPanel/NewBlockMenu/HorizontalScroll";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import {
  ContentCard,
  ContentCardDescription,
  ContentCardTitle,
} from "../../components/ToolAccordion/AccordionContent";
import { ToolAccordion } from "../../components/ToolAccordion/ToolAccordion";
import { AccordionIcon, ToolIcon } from "../FindBlocks/helpers";
import {
  type CapabilityListing,
  type FindCapabilityToolPart,
  connectionBadge,
  getAnimationText,
  kindLabel,
  parseOutput,
  queryOf,
} from "./helpers";

interface Props {
  part: FindCapabilityToolPart;
}

function CapabilityCard({ item }: { item: CapabilityListing }) {
  const { t } = useTranslation();
  const badge = connectionBadge(item, t);
  return (
    <ContentCard className="w-52 shrink-0">
      <div className="flex items-start justify-between gap-2">
        <ContentCardTitle className="truncate">{item.name}</ContentCardTitle>
        {badge && (
          <span
            className={
              "shrink-0 rounded-full px-2 py-0.5 text-caption-sm leading-inherit " +
              badge.className
            }
          >
            {badge.label}
          </span>
        )}
      </div>
      <ContentCardDescription className="mt-1 line-clamp-2">
        {item.purpose}
      </ContentCardDescription>
      <p className="mt-1 text-caption-sm leading-inherit text-foreground-tertiary">
        {kindLabel(item, t)}
      </p>
    </ContentCard>
  );
}

export function FindCapabilitiesTool({ part }: Props) {
  const { t } = useTranslation();
  const text = getAnimationText(part, t);
  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";
  const isError = part.state === "output-error";
  const parsed =
    part.state === "output-available" ? parseOutput(part.output) : null;
  const items = parsed
    ? [...parsed.capabilities, ...(parsed.fallback ?? [])]
    : [];
  const query = queryOf(part);
  const description = parsed
    ? t(
        `${parsed.count} result${parsed.count === 1 ? "" : "s"}${query ? ` for "${query}"` : ""}`,
        `${parsed.count} 条结果${query ? `，搜索：“${query}”` : ""}`,
      )
    : undefined;

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-body text-foreground-tertiary">
        <ToolIcon isStreaming={isStreaming} isError={isError} />
        <MorphingTextAnimation
          text={text}
          className={isError ? "text-error" : undefined}
        />
      </div>

      {items.length > 0 && (
        <ToolAccordion
          icon={<AccordionIcon />}
          title={t("Results", "结果")}
          description={description}
        >
          <HorizontalScroll dependencyList={[items.length]}>
            {items.map((item) => (
              <CapabilityCard key={item.id} item={item} />
            ))}
          </HorizontalScroll>
        </ToolAccordion>
      )}
    </div>
  );
}

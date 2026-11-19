"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  name?: string;
  isOtto?: boolean;
  role?: string | null;
  jobTitle?: string | null;
  size?: "compact" | "card" | "page";
  nameAccessory?: ReactNode;
  /** Badges and icons ride the middle of the name; a second line of type
   *  sits on its baseline. */
  nameAlign?: "center" | "baseline";
}

export function ExpertIdentityDetails({
  name,
  isOtto = false,
  role,
  jobTitle,
  size = "card",
  nameAccessory,
  nameAlign = "center",
}: Props) {
  const { t, locale } = useTranslation();
  const compact = size === "compact";
  const Container = compact ? "span" : "div";
  const profession = getExpertDisplayTitle({ jobTitle, role }, locale);
  const title = isOtto ? (name ?? "Otto") : profession;

  return (
    <Container
      data-slot="expert-identity"
      className={cn(
        "flex min-w-0 flex-col text-left",
        compact ? "gap-0" : "gap-1",
      )}
    >
      <Container
        data-slot="expert-identity-name-line"
        className={cn(
          "flex min-w-0 gap-2",
          size === "page" && "flex-wrap gap-y-0",
          nameAlign === "baseline" ? "items-baseline" : "items-center",
        )}
      >
        <Text
          as={size === "page" ? "h1" : "span"}
          variant={
            size === "page"
              ? "heading-md"
              : compact
                ? "body-medium"
                : "lead-semibold"
          }
          tone="primary"
          weight={size === "page" ? "semibold" : undefined}
          title={title}
          data-slot="expert-identity-name"
          className={cn(
            "min-w-0",
            size === "page" ? "max-w-full break-words" : "truncate",
            compact && "leading-4.5",
          )}
        >
          {title}
        </Text>
        {nameAccessory}
      </Container>
      {isOtto && (
        <Text
          as="span"
          variant="small"
          tone="muted"
          data-slot="expert-identity-subtitle"
          title={role || jobTitle ? profession : undefined}
        >
          {role || jobTitle
            ? profession
            : t("Your personal Head of AI", "您的专属 AI 负责人")}
        </Text>
      )}
    </Container>
  );
}

"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useId } from "react";

import { Text } from "@/components/atoms/Text/Text";
import type { Variant } from "@/components/atoms/Text/helpers";
import type { MCPAuthScheme } from "@/lib/mcp-auth";

interface Props {
  value: MCPAuthScheme;
  onChange: (scheme: MCPAuthScheme) => void;
  disabled?: boolean;
  /** Disambiguates the accessible name when several connectors render at once. */
  nameSuffix?: string;
  className?: string;
  labelClassName?: string;
  /** Renders the label as a `<Text>` in this variant, in the parent's colour. */
  labelVariant?: Variant;
  selectClassName?: string;
}

/** Bearer/Basic selector shared by every surface that takes a manual MCP credential. */
export function MCPAuthSchemeField({
  value,
  onChange,
  disabled,
  nameSuffix,
  className,
  labelClassName,
  labelVariant,
  selectClassName,
}: Props) {
  const { t } = useTranslation();

  const id = useId();
  const accessibleName = nameSuffix
    ? t(`Authentication type for ${nameSuffix}`, `${nameSuffix} 的身份验证类型`)
    : undefined;

  return (
    <div className={className}>
      {labelVariant ? (
        <Text
          variant={labelVariant}
          as="label"
          tone="inherit"
          htmlFor={id}
          className={labelClassName}
        >
          {t("Authentication type", "身份验证类型")}
        </Text>
      ) : (
        <label htmlFor={id} className={labelClassName}>
          {t("Authentication type", "身份验证类型")}
        </label>
      )}
      <select
        id={id}
        aria-label={accessibleName}
        value={value}
        onChange={(e) => onChange(e.target.value as MCPAuthScheme)}
        disabled={disabled}
        className={selectClassName}
      >
        <option value="bearer">
          {t("API token (Bearer)", "API 令牌（Bearer）")}
        </option>
        <option value="basic">
          {t("Basic authentication", "基本身份验证")}
        </option>
      </select>
    </div>
  );
}

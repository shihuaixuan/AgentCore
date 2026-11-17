"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { noPasswordManager } from "./helpers";

interface Props {
  serverURL: string;
  onChange: (url: string) => void;
  readOnly: boolean;
  disabled: boolean;
  options?: { label: string; url: string }[];
}

export function MCPServerURLField({
  serverURL,
  onChange,
  readOnly,
  disabled,
  options = [],
}: Props) {
  const { t } = useTranslation();

  const [customSelected, setCustomSelected] = useState(false);
  const matched = options.find((option) => option.url === serverURL);
  const selection = customSelected ? "custom" : (matched?.url ?? "");

  function selectURL(value: string) {
    setCustomSelected(value === "custom");
    onChange(value === "custom" ? "" : value);
  }

  function changeURL(value: string) {
    if (options.length) setCustomSelected(true);
    onChange(value);
  }

  return (
    <>
      {!readOnly && options.length > 0 && (
        <Select
          id="mcp-server-region"
          label={t("Server region", "服务器区域")}
          placeholder={t("Choose your account's region", "选择账户所在区域")}
          value={selection}
          onValueChange={selectURL}
          disabled={disabled}
          options={[
            ...options.map((option) => ({
              label: option.label,
              value: option.url,
            })),
            { label: t("Custom URL", "自定义 URL"), value: "custom" },
          ]}
        />
      )}
      <Input
        id="mcp-server-url"
        label={t("Server URL", "服务器 URL")}
        type="url"
        placeholder="https://mcp.example.com"
        value={serverURL}
        onChange={(event) => changeURL(event.target.value)}
        disabled={disabled}
        readOnly={readOnly || Boolean(matched && !customSelected)}
        autoFocus={!readOnly && options.length === 0}
        {...noPasswordManager}
      />
    </>
  );
}

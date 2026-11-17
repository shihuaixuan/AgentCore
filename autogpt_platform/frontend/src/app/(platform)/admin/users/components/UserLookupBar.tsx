"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  initialValue: string;
  isLoading: boolean;
  showHint: boolean;
  onSearch: (value: string) => void;
}

export function UserLookupBar({
  initialValue,
  isLoading,
  showHint,
  onSearch,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only where it can't pop up a touch keyboard over the page.
    if (!initialValue && window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, [initialValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex max-w-[640px] flex-col gap-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          ref={inputRef}
          value={value}
          onChange={setValue}
          placeholder={t("User ID or email…", "用户 ID 或邮箱…")}
          name="user"
          autoComplete="off"
          spellCheck={false}
          aria-label={t("User ID or email", "用户 ID 或邮箱")}
          disabled={isLoading}
          size="small"
        />
        <Button
          type="submit"
          variant="primary"
          size="small"
          loading={isLoading}
          disabled={!value.trim()}
          className="shrink-0"
        >
          {t("Look up", "查找")}
        </Button>
      </div>
      {showHint ? (
        <Text variant="small" tone="muted">
          {t("Exact match only: a full user ID or the complete email address.", "仅支持精确匹配：完整用户 ID 或完整邮箱地址。")}
        </Text>
      ) : null}
    </form>
  );
}

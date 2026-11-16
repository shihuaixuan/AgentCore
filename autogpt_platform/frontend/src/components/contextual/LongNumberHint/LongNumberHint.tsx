"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { hasLongWholeNumber } from "@/lib/json-text";

interface Props {
  /** The JSON text exactly as the field shows it. */
  text: string;
  id?: string;
}

/** Under a free-form JSON field: says a whole number in it is too long to be
 *  saved exactly, and how to keep it. Nothing is changed for the user; the
 *  block on the other end may want a number, so only they can decide. */
export function LongNumberHint({ text, id }: Props) {
  const { t } = useTranslation();

  if (!hasLongWholeNumber(text)) return null;
  return (
    <Text variant="small" tone="warning" id={id}>
      {t(
        "Numbers this long get rounded. Put them in quotes to keep every digit.",
        "这么长的数字会被舍入。请加上引号以保留每一位数字。",
      )}
    </Text>
  );
}

"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  label: string;
  value: string | null;
}

/** One labelled paragraph on a Basics tab, shared by the expert and
 *  Otto pages so their headings stay the same size. */
export function ProfileEntry({ label, value }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <Text variant="large-medium" as="dt" tone="primary">
        {label}
      </Text>
      <Text
        variant="body-md"
        as="dd"
        tone="secondary"
        className="mt-1 whitespace-pre-line"
      >
        {value || t("Not set yet.", "尚未设置。")}
      </Text>
    </div>
  );
}

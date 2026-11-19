"use client";

import { FormProvider } from "react-hook-form";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/molecules/Form/Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import type { User } from "@/lib/auth/types";
import * as React from "react";
import { TIMEZONES } from "./helpers";
import { useTimezoneForm } from "./useTimezoneForm";

type Props = {
  user: User;
  currentTimezone?: string;
};

export function TimezoneForm({ user, currentTimezone = "not-set" }: Props) {
  const { t } = useTranslation();
  // If timezone is not set, try to detect it from the browser
  const effectiveTimezone = React.useMemo(() => {
    if (currentTimezone === "not-set") {
      // Try to get browser timezone as a suggestion
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch {
        return "UTC";
      }
    }
    return currentTimezone;
  }, [currentTimezone]);

  const { form, onSubmit, isLoading } = useTimezoneForm({
    user,
    currentTimezone: effectiveTimezone,
  });

  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>{t("Timezone", "时区")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Text
                      variant="body-medium-lh-none"
                      as="span"
                      tone="inherit"
                    >
                      {t("Select your timezone", "选择你的时区")}
                    </Text>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("Select a timezone", "选择时区")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} size="small">
              {isLoading
                ? t("Saving...", "正在保存…")
                : t("Save timezone", "保存时区")}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

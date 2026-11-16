"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/molecules/Form/Form";

import type { CreateAPIKeyFormValues } from "../schema";
import { PermissionsCheckboxGroup } from "./PermissionsCheckboxGroup";

interface Props {
  form: UseFormReturn<CreateAPIKeyFormValues>;
  onSubmit: (values: CreateAPIKeyFormValues) => Promise<void> | void;
  isPending: boolean;
}

export function CreateAPIKeyForm({ form, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  return (
    // oxlint-disable-next-line design-system/no-restyle -- the key form stacks its fields with a 4px inset for focus rings
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4 px-1">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                label={t("Name", "名称")}
                placeholder={t("My integration key", "我的集成密钥")}
                wrapperClassName="!mb-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                label={t("Description (optional)", "说明（可选）")}
                placeholder={t(
                  "Describe what this key is used for",
                  "描述此密钥的用途",
                )}
                wrapperClassName="!mb-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="permissions"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <PermissionsCheckboxGroup
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="submit"
        variant="primary"
        size="large"
        disabled={!form.formState.isValid || isPending}
        loading={isPending}
      >
        {t("Create Key", "创建密钥")}
      </Button>
    </Form>
  );
}

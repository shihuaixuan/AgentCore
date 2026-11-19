"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/molecules/Form/Form";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";

import { useApiKeyConnectForm } from "./useApiKeyConnectForm";

interface Props {
  provider: string;
  providerName: string;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
}

export function ApiKeyConnectForm({
  provider,
  providerName,
  onSuccess,
}: Props) {
  const { t } = useTranslation();

  const { form, handleSubmit, isPending } = useApiKeyConnectForm({
    provider,
    onSuccess,
  });

  return (
    <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                label={t("Name", "名称")}
                placeholder={t(
                  `My ${providerName} key`,
                  `我的 ${providerName} 密钥`,
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
        name="apiKey"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                spellCheck={false}
                label={t("API key", "API 密钥")}
                placeholder="sk-..."
                wrapperClassName="!mb-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expiresAt"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                id={field.name}
                type="date"
                label={t("Expires (optional)", "到期时间（可选）")}
                hint={t(
                  "Leave blank to keep the key indefinitely",
                  "留空则密钥永久有效",
                )}
                wrapperClassName="!mb-0"
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
        {t("Save API key", "保存 API 密钥")}
      </Button>
    </Form>
  );
}

"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import {
  buildServerScope,
  getServerFieldSchema,
  getServerScopeSchemes,
} from "@/components/contextual/CredentialsInput/helpers";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/molecules/Form/Form";

import { useInlineConnectForm } from "./useInlineConnectForm";

const userPasswordConnectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    server: z.string().trim(),
    scheme: z.string(),
  })
  .strict();

type UserPasswordConnectFormValues = z.infer<typeof userPasswordConnectSchema>;

interface Props {
  provider: string;
  providerName: string;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
}

// Carries its own submit, because the panel footer's Continue only drives
// OAuth and API key.
export function InlineUserPasswordForm({
  provider,
  providerName,
  onSuccess,
}: Props) {
  const { t } = useTranslation();

  const { submit, isPending } = useInlineConnectForm({
    provider,
    successTitle: t("Credentials saved", "凭据已保存"),
    failureTitle: t("Couldn't save credentials", "无法保存凭据"),
    onSuccess,
  });

  const schemes = getServerScopeSchemes(provider);

  const form = useForm<UserPasswordConnectFormValues>({
    resolver: zodResolver(
      schemes
        ? userPasswordConnectSchema.extend({
            server: getServerFieldSchema(provider),
          })
        : userPasswordConnectSchema,
    ),
    defaultValues: {
      title: "",
      username: "",
      password: "",
      server: "",
      scheme: schemes?.[0].value ?? "",
    },
    mode: "onChange",
  });

  function handleSubmit(values: UserPasswordConnectFormValues) {
    submit({
      provider,
      type: "user_password",
      title: values.title,
      username: values.username,
      password: values.password,
      ...(schemes && { scope: buildServerScope(values.scheme, values.server) }),
    });
  }

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-2.5">
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
                labelVariant="small-medium"
                size="small"
                placeholder={`My ${providerName} account`}
                wrapperClassName="!mb-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {schemes && schemes.length > 1 && (
        <FormField
          control={form.control}
          name="scheme"
          render={({ field }) => (
            <FormItem>
              <Select
                id={field.name}
                label={t("Database type", "数据库类型")}
                labelVariant="small-medium"
                size="small"
                value={field.value}
                onValueChange={field.onChange}
                options={schemes}
                wrapperClassName="!mb-0"
              />
            </FormItem>
          )}
        />
      )}

      {schemes && (
        <FormField
          control={form.control}
          name="server"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="off"
                  spellCheck={false}
                  label={t("Server", "服务器")}
                  labelVariant="small-medium"
                  size="small"
                  placeholder="host or host:port"
                  hint="This login is only ever sent to this server."
                  wrapperClassName="!mb-0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                spellCheck={false}
                label={t("Username", "用户名")}
                labelVariant="small-medium"
                size="small"
                wrapperClassName="!mb-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                label={t("Password", "密码")}
                labelVariant="small-medium"
                size="small"
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
        size="small"
        className="w-full"
        disabled={!form.formState.isValid}
        loading={isPending}
      >
        {isPending ? "Connecting…" : "Connect"}
      </Button>
    </Form>
  );
}

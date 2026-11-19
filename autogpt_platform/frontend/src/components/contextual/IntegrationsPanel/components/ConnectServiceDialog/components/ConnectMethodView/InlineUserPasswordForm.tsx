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

function createUserPasswordConnectSchema(
  t: (english: string, chinese: string) => string,
) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t("Name is required", "请输入名称"))
        .max(
          100,
          t("Name must be 100 characters or less", "名称不能超过 100 个字符"),
        ),
      username: z
        .string()
        .trim()
        .min(1, t("Username is required", "请输入用户名")),
      password: z.string().min(1, t("Password is required", "请输入密码")),
      server: z.string().trim(),
      scheme: z.string(),
    })
    .strict();
}

type UserPasswordConnectFormValues = z.infer<
  ReturnType<typeof createUserPasswordConnectSchema>
>;

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
  const { t, locale } = useTranslation();

  const { submit, isPending } = useInlineConnectForm({
    provider,
    successTitle: t("Credentials saved", "凭据已保存"),
    failureTitle: t("Couldn't save credentials", "无法保存凭据"),
    onSuccess,
  });

  const schemes = getServerScopeSchemes(provider);
  const userPasswordConnectSchema = createUserPasswordConnectSchema(t);

  const form = useForm<UserPasswordConnectFormValues>({
    resolver: zodResolver(
      schemes
        ? userPasswordConnectSchema.extend({
            server: getServerFieldSchema(provider, locale),
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
                placeholder={t(
                  `My ${providerName} account`,
                  `我的 ${providerName} 账号`,
                )}
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
                  placeholder={t("host or host:port", "主机名或主机名:端口")}
                  hint={t(
                    "This login is only ever sent to this server.",
                    "此登录信息只会发送给该服务器。",
                  )}
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
        {isPending ? t("Connecting…", "正在连接…") : t("Connect", "连接")}
      </Button>
    </Form>
  );
}

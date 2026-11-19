"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import useCredentials from "@/hooks/useCredentials";
import {
  BlockIOCredentialsSubSchema,
  CredentialsMetaInput,
} from "@/lib/autogpt-server-api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import {
  buildServerScope,
  getServerFieldSchema,
  getServerScopeSchemes,
} from "../../helpers";

type Props = {
  schema: BlockIOCredentialsSubSchema;
  open: boolean;
  onClose: () => void;
  onCredentialsCreate: (creds: CredentialsMetaInput) => void;
  siblingInputs?: Record<string, any>;
};

export function PasswordCredentialsModal({
  schema,
  open,
  onClose,
  onCredentialsCreate,
  siblingInputs,
}: Props) {
  const { t, locale } = useTranslation();

  const credentials = useCredentials(schema, siblingInputs);
  const schemes = credentials
    ? getServerScopeSchemes(credentials.provider)
    : null;

  const formSchema = z.object({
    server:
      schemes && credentials
        ? getServerFieldSchema(credentials.provider, locale)
        : z.string().trim(),
    scheme: z.string(),
    username: z.string().min(1, t("Username is required", "请输入用户名")),
    password: z.string().min(1, t("Password is required", "请输入密码")),
    title: z.string().min(1, t("Name is required", "请输入名称")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      server: "",
      scheme: schemes?.[0].value ?? "",
      username: "",
      password: "",
      title: "",
    },
  });

  if (
    !credentials ||
    credentials.isLoading ||
    !credentials.supportsUserPassword
  ) {
    return null;
  }

  const { provider, providerName, createUserPasswordCredentials } = credentials;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newCredentials = await createUserPasswordCredentials({
      username: values.username,
      password: values.password,
      title: values.title,
      ...(schemes && { scope: buildServerScope(values.scheme, values.server) }),
    });
    onCredentialsCreate({
      provider,
      id: newCredentials.id,
      type: "user_password",
      title: newCredentials.title,
    });
  }

  return (
    <Dialog
      title={t(
        `Add new username & password for ${providerName}`,
        `为 ${providerName} 添加用户名和密码`,
      )}
      controlled={{
        isOpen: open,
        set: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      onClose={onClose}
      styling={{
        maxWidth: "25rem",
      }}
    >
      <Dialog.Content>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-[98%] space-y-2 pt-4"
          >
            {schemes && schemes.length > 1 && (
              <FormField
                control={form.control}
                name="scheme"
                render={({ field }) => (
                  <Select
                    id="scheme"
                    label={t("Database type", "数据库类型")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={schemes}
                  />
                )}
              />
            )}
            {schemes && (
              <FormField
                control={form.control}
                name="server"
                render={({ field, fieldState }) => (
                  <Input
                    id="server"
                    error={fieldState.error?.message}
                    label={t("Server", "服务器")}
                    type="text"
                    placeholder={t("host or host:port", "主机名或主机名:端口")}
                    hint={t(
                      "This login is only ever sent to this server.",
                      "此登录信息只会发送给该服务器。",
                    )}
                    {...field}
                  />
                )}
              />
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <Input
                  id="username"
                  error={fieldState.error?.message}
                  label={t("Username", "用户名")}
                  type="text"
                  placeholder={t("Enter username...", "输入用户名…")}
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Input
                  id="password"
                  error={fieldState.error?.message}
                  label={t("Password", "密码")}
                  type="password"
                  placeholder={t("Enter password...", "输入密码…")}
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Input
                  id="title"
                  error={fieldState.error?.message}
                  label={t("Name", "名称")}
                  type="text"
                  placeholder={t(
                    "Enter a name for this user login...",
                    "为此登录凭据输入名称…",
                  )}
                  className="mb-8"
                  {...field}
                />
              )}
            />
            <Button type="submit" className="w-full">
              {t("Save & use this user login", "保存并使用此登录凭据")}
            </Button>
          </form>
        </FormProvider>
      </Dialog.Content>
    </Dialog>
  );
}

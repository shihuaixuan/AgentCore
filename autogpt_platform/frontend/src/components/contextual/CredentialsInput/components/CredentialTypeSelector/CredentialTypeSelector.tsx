"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { FormProvider } from "react-hook-form";
import { FormDescription, FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  TabsLine,
  TabsLineContent,
  TabsLineList,
  TabsLineTrigger,
} from "@/components/molecules/TabsLine/TabsLine";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import {
  BlockIOCredentialsSubSchema,
  CredentialsMetaInput,
  CredentialsType,
} from "@/lib/autogpt-server-api/types";
import { useAPIKeyCredentialsModal } from "../APIKeyCredentialsModal/useAPIKeyCredentialsModal";
import { getCredentialTypeIcon, getCredentialTypeLabel } from "../../helpers";

type Props = {
  schema: BlockIOCredentialsSubSchema;
  open: boolean;
  onClose: () => void;
  provider: string;
  providerName: string;
  supportedTypes: CredentialsType[];
  onCredentialsCreate: (creds: CredentialsMetaInput) => void;
  onOAuthLogin: () => void;
  onOpenPasswordModal: () => void;
  onOpenHostScopedModal: () => void;
  siblingInputs?: Record<string, unknown>;
};

export function CredentialTypeSelector({
  schema,
  open,
  onClose,
  provider,
  providerName,
  supportedTypes,
  onCredentialsCreate,
  onOAuthLogin,
  onOpenPasswordModal,
  onOpenHostScopedModal,
  siblingInputs,
}: Props) {
  const { t } = useTranslation();

  const defaultTab = supportedTypes[0];

  return (
    <Dialog
      title={t(
        `Add credential for ${providerName}`,
        `为 ${providerName} 添加凭据`,
      )}
      controlled={{
        isOpen: open,
        set: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      onClose={onClose}
      styling={{ maxWidth: "28rem" }}
    >
      <Dialog.Content>
        <TabsLine defaultValue={defaultTab}>
          <TabsLineList>
            {supportedTypes.map((type) => {
              const Icon = getCredentialTypeIcon(type, provider);
              return (
                <TabsLineTrigger
                  key={type}
                  value={type}
                  className="inline-flex items-center gap-1.5"
                >
                  <Icon size={16} />
                  {getCredentialTypeLabel(type, t)}
                </TabsLineTrigger>
              );
            })}
          </TabsLineList>

          {supportedTypes.includes("oauth2") && (
            <TabsLineContent value="oauth2">
              <OAuthTabContent
                providerName={providerName}
                onOAuthLogin={() => {
                  onClose();
                  onOAuthLogin();
                }}
              />
            </TabsLineContent>
          )}

          {supportedTypes.includes("api_key") && (
            <TabsLineContent value="api_key">
              <APIKeyTabContent
                schema={schema}
                siblingInputs={siblingInputs}
                onCredentialsCreate={(creds) => {
                  onCredentialsCreate(creds);
                  onClose();
                }}
              />
            </TabsLineContent>
          )}

          {supportedTypes.includes("user_password") && (
            <TabsLineContent value="user_password">
              <SimpleActionTab
                description={t(
                  "Add a username and password credential.",
                  "添加用户名和密码凭据。",
                )}
                buttonLabel="Enter credentials"
                onClick={() => {
                  onClose();
                  onOpenPasswordModal();
                }}
              />
            </TabsLineContent>
          )}

          {supportedTypes.includes("host_scoped") && (
            <TabsLineContent value="host_scoped">
              <SimpleActionTab
                description={t(
                  "Add host-scoped headers for authentication.",
                  "添加限定主机的请求头以进行身份验证。",
                )}
                buttonLabel="Add headers"
                onClick={() => {
                  onClose();
                  onOpenHostScopedModal();
                }}
              />
            </TabsLineContent>
          )}
        </TabsLine>
      </Dialog.Content>
    </Dialog>
  );
}

type OAuthTabContentProps = {
  providerName: string;
  onOAuthLogin: () => void;
};

function OAuthTabContent({ providerName, onOAuthLogin }: OAuthTabContentProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Text variant="body-tight" as="p" tone="secondary">
        {t(
          `Sign in with your ${providerName} account using OAuth.`,
          `通过 OAuth 使用您的 ${providerName} 账户登录。`,
        )}
      </Text>
      <Button
        variant="primary"
        size="small"
        onClick={onOAuthLogin}
        type="button"
      >
        {t(`Sign in with ${providerName}`, `使用 ${providerName} 登录`)}
      </Button>
    </div>
  );
}

type APIKeyTabContentProps = {
  schema: BlockIOCredentialsSubSchema;
  siblingInputs?: Record<string, unknown>;
  onCredentialsCreate: (creds: CredentialsMetaInput) => void;
};

function APIKeyTabContent({
  schema,
  siblingInputs,
  onCredentialsCreate,
}: APIKeyTabContentProps) {
  const { t } = useTranslation();

  const {
    form,
    isLoading,
    isSubmitting,
    supportsApiKey,
    schemaDescription,
    onSubmit,
  } = useAPIKeyCredentialsModal({ schema, siblingInputs, onCredentialsCreate });

  if (!supportsApiKey && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-68" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schemaDescription && (
        <Text variant="body-tight" as="p" tone="secondary">
          {schemaDescription}
        </Text>
      )}

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <Input
                id="title"
                label={t("Name", "名称")}
                type="text"
                placeholder={t(
                  "Enter a name for this API Key...",
                  "为此 API 密钥输入名称…",
                )}
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <Input
                id="apiKey"
                label={t("API Key", "API 密钥")}
                type="password"
                placeholder={t("Enter API Key...", "输入 API 密钥…")}
                hint={
                  schema.credentials_scopes ? (
                    <FormDescription className="text-body-sm leading-inherit">
                      {t(
                        "Required scope(s) for this block:",
                        "此模块所需的权限范围：",
                      )}{" "}
                      {schema.credentials_scopes?.map((s, i, a) => (
                        <span key={i}>
                          <Text
                            variant="small-mono-bold-tight"
                            as="code"
                            tone="inherit"
                          >
                            {s}
                          </Text>
                          {i < a.length - 1 && ", "}
                        </span>
                      ))}
                    </FormDescription>
                  ) : null
                }
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <Input
                id="expiresAt"
                label={t("Expiration Date", "到期日期")}
                type="datetime-local"
                placeholder={t("Select expiration date...", "选择到期日期…")}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />
          <Button
            type="submit"
            className="min-w-68"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {t("Add API Key", "添加 API 密钥")}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}

type SimpleActionTabProps = {
  description: string;
  buttonLabel: string;
  onClick: () => void;
};

function SimpleActionTab({
  description,
  buttonLabel,
  onClick,
}: SimpleActionTabProps) {
  return (
    <div className="space-y-4">
      <Text variant="body-tight" as="p" tone="secondary">
        {description}
      </Text>
      <Button variant="primary" size="small" onClick={onClick} type="button">
        {buttonLabel}
      </Button>
    </div>
  );
}

"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FormProvider } from "react-hook-form";
import { FormDescription, FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  BlockIOCredentialsSubSchema,
  CredentialsMetaInput,
} from "@/lib/autogpt-server-api/types";
import { useAPIKeyCredentialsModal } from "./useAPIKeyCredentialsModal";

type Props = {
  schema: BlockIOCredentialsSubSchema;
  open: boolean;
  onClose: () => void;
  onCredentialsCreate: (creds: CredentialsMetaInput) => void;
  siblingInputs?: Record<string, any>;
};

export function APIKeyCredentialsModal({
  schema,
  open,
  onClose,
  onCredentialsCreate,
  siblingInputs,
}: Props) {
  const { t } = useTranslation();

  const {
    form,
    isLoading,
    isSubmitting,
    supportsApiKey,
    providerName,
    schemaDescription,
    onSubmit,
  } = useAPIKeyCredentialsModal({ schema, siblingInputs, onCredentialsCreate });

  if (isLoading || !supportsApiKey) {
    return null;
  }

  return (
    <Dialog
      title={t(
        `Add new API key for ${providerName ?? ""}`,
        `为 ${providerName ?? ""} 添加新 API 密钥`,
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
        {schemaDescription && (
          <Text variant="body-tight" as="p" tone="secondary" className="mb-4">
            {schemaDescription}
          </Text>
        )}

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 px-2"
          >
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
                <>
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
                </>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const dateTime = new Date(value);
                      dateTime.setHours(0, 0, 0, 0);
                      const year = dateTime.getFullYear();
                      const month = String(dateTime.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const day = String(dateTime.getDate()).padStart(2, "0");
                      const normalizedValue = `${year}-${month}-${day}T00:00`;
                      field.onChange(normalizedValue);
                    } else {
                      field.onChange(value);
                    }
                  }}
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
      </Dialog.Content>
    </Dialog>
  );
}

"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useContext, useEffect, useState } from "react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  FormDescription,
  FormField,
  FormLabel,
} from "@/components/molecules/Form/Form";
import useCredentials from "@/hooks/useCredentials";
import {
  BlockIOCredentialsSubSchema,
  CredentialsMetaInput,
} from "@/lib/autogpt-server-api/types";
import { CredentialsProvidersContext } from "@/providers/agent-credentials/credentials-provider";
import { getHostFromUrl } from "@/lib/utils/url";
import { toast } from "@/components/molecules/Toast/use-toast";
import {
  addHeaderPairToList,
  findExistingHostCredentials,
  hasExistingHostCredential,
  headerPairsToRecord,
  removeHeaderPairFromList,
  updateHeaderPairInList,
  type HeaderPair,
} from "../../helpers";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  schema: BlockIOCredentialsSubSchema;
  open: boolean;
  onClose: () => void;
  onCredentialsCreate: (creds: CredentialsMetaInput) => void;
  siblingInputs?: Record<string, any>;
};

export function HostScopedCredentialsModal({
  schema,
  open,
  onClose,
  onCredentialsCreate,
  siblingInputs,
}: Props) {
  const { t } = useTranslation();

  const credentials = useCredentials(schema, siblingInputs);
  const allProviders = useContext(CredentialsProvidersContext);

  // Get current host from siblingInputs or discriminator_values
  const currentUrl = credentials?.discriminatorValue;
  const currentHost = currentUrl ? getHostFromUrl(currentUrl) : "";

  const formSchema = z.object({
    host: z
      .string()
      .min(1, t("Host is required", "请输入主机"))
      .refine((val) => !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(val), {
        message: t(
          "Enter only the host (e.g. api.example.com), not a full URL",
          "仅输入主机（例如 api.example.com），不要输入完整 URL",
        ),
      })
      .refine((val) => !val.includes("/"), {
        message: t(
          "Enter only the host (e.g. api.example.com), without a trailing path. " +
            "You may specify a port (e.g. api.example.com:8080) if needed.",
          "仅输入主机（例如 api.example.com），不要附加路径。如有需要，可以指定端口（例如 api.example.com:8080）。",
        ),
      }),
    title: z.string().optional(),
    headers: z.record(z.string()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: currentHost || "",
      title: currentHost || "Manual Entry",
      headers: {},
    },
  });

  const [headerPairs, setHeaderPairs] = useState<HeaderPair[]>([
    { key: "", value: "" },
  ]);

  // Update form values when siblingInputs change
  useEffect(() => {
    if (currentHost) {
      form.setValue("host", currentHost);
      form.setValue("title", currentHost);
    } else {
      // Reset to empty when no current host
      form.setValue("host", "");
      form.setValue("title", "Manual Entry");
    }
  }, [currentHost, form]);

  if (
    !credentials ||
    credentials.isLoading ||
    !credentials.supportsHostScoped
  ) {
    return null;
  }

  const {
    provider,
    providerName,
    createHostScopedCredentials,
    deleteCredentials,
  } = credentials;

  // Use the unfiltered credential list from the provider context for deduplication.
  // The hook's savedCredentials is pre-filtered by discriminatorValue, which may be
  // empty when no URL is entered yet — causing deduplication to miss existing creds.
  const allProviderCredentials =
    allProviders?.[provider]?.savedCredentials ?? [];

  const hasExistingForHost = hasExistingHostCredential(
    allProviderCredentials,
    currentHost || form.getValues("host"),
  );

  const addHeaderPair = () => {
    setHeaderPairs((prev) => addHeaderPairToList(prev));
  };

  const removeHeaderPair = (index: number) => {
    setHeaderPairs((prev) => removeHeaderPairFromList(prev, index));
  };

  const updateHeaderPair = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setHeaderPairs((prev) => updateHeaderPairInList(prev, index, field, value));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const headers = headerPairsToRecord(headerPairs);

    // Delete existing host-scoped credentials for the same host to avoid duplicates.
    // Uses unfiltered provider credentials (not the hook's pre-filtered list).
    const host = values.host;
    const existingForHost = findExistingHostCredentials(
      allProviderCredentials,
      host,
    );

    try {
      for (const existing of existingForHost) {
        await deleteCredentials(existing.id, true);
      }

      const newCredentials = await createHostScopedCredentials({
        host,
        title: currentHost || host,
        headers,
      });

      onCredentialsCreate({
        provider,
        id: newCredentials.id,
        type: "host_scoped",
        title: newCredentials.title,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("Something went wrong", "出现错误");
      toast({
        title: t("Failed to save credentials", "保存凭据失败"),
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog
      title={
        hasExistingForHost
          ? t(
              `Update sensitive headers for ${providerName}`,
              `更新 ${providerName} 的敏感请求头`,
            )
          : t(
              `Add sensitive headers for ${providerName}`,
              `为 ${providerName} 添加敏感请求头`,
            )
      }
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
        {schema.description && (
          <Text variant="body-tight" as="p" tone="secondary" className="mb-4">
            {schema.description}
          </Text>
        )}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <Input
                  id="host"
                  label={t("Host Pattern", "主机匹配规则")}
                  type="text"
                  size="small"
                  readOnly={!!currentHost}
                  hint={
                    currentHost
                      ? t(
                          "Auto-populated from the URL field. Headers will be applied to requests to this host.",
                          "已从 URL 字段自动填入。向此主机发送请求时将携带这些请求头。",
                        )
                      : t(
                          "Enter the host/domain to match against request URLs (e.g., api.example.com).",
                          "输入用于匹配请求 URL 的主机或域名（例如 api.example.com）。",
                        )
                  }
                  placeholder={
                    currentHost
                      ? undefined
                      : t(
                          "Enter host (e.g., api.example.com)",
                          "输入主机（例如 api.example.com）",
                        )
                  }
                  {...field}
                />
              )}
            />

            <div className="space-y-2">
              <FormLabel className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Text variant="body-medium-lh-none" as="span" tone="inherit">
                  {t("Headers", "请求头")}
                </Text>
              </FormLabel>
              <FormDescription className="max-w-md text-body-sm leading-inherit">
                {t(
                  "Add sensitive headers (like Authorization, X-API-Key) that should be automatically included in requests to the specified host.",
                  "添加敏感请求头（例如 Authorization、X-API-Key），向指定主机发送请求时将自动携带这些请求头。",
                )}
              </FormDescription>

              {headerPairs.map((pair, index) => (
                <div key={index} className="flex w-full items-center gap-4">
                  <Input
                    id={`header-${index}-key`}
                    label={t("Header Name", "请求头名称")}
                    placeholder={t(
                      "Header name (e.g., Authorization)",
                      "请求头名称（例如 Authorization）",
                    )}
                    size="small"
                    value={pair.key}
                    className="flex-1"
                    onChange={(e) =>
                      updateHeaderPair(index, "key", e.target.value)
                    }
                  />

                  <Input
                    id={`header-${index}-value`}
                    label={t("Header Value", "请求头值")}
                    size="small"
                    type="password"
                    placeholder={t(
                      "Header value (e.g., Bearer token123)",
                      "请求头值（例如 Bearer token123）",
                    )}
                    value={pair.value}
                    onChange={(e) =>
                      updateHeaderPair(index, "value", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => removeHeaderPair(index)}
                    disabled={headerPairs.length === 1}
                  >
                    <Icon icon={Delete02Icon} className="size-4" />{" "}
                    {t("Remove", "移除")}
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={addHeaderPair}
              >
                <Icon icon={PlusSignIcon} className="size-4" />{" "}
                {t("Add Another Header", "添加另一个请求头")}
              </Button>
            </div>

            <div className="pt-8">
              <Button type="submit" className="w-full" size="small">
                {hasExistingForHost
                  ? t("Update & use these credentials", "更新并使用这些凭据")
                  : t("Save & use these credentials", "保存并使用这些凭据")}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Dialog.Content>
    </Dialog>
  );
}

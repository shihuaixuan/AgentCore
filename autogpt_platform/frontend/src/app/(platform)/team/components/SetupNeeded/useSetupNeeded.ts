import {
  useGrantExpertCredentials,
  useListExpertSetupItems,
} from "@/app/api/__generated__/endpoints/experts/experts";
import { useGetV1ListProviders } from "@/app/api/__generated__/endpoints/integrations/integrations";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { ExpertSetupItem } from "@/app/api/__generated__/models/expertSetupItem";
import { okData } from "@/app/api/helpers";
import { toConnectableProviders } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { serviceName } from "@/components/contextual/IntegrationsPanel/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { invalidateExpertGrantQueries } from "@/services/experts/invalidate-experts";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useSetupNeeded(experts: Expert[]) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<ExpertSetupItem | null>(null);

  const itemsQuery = useListExpertSetupItems({
    query: { select: (res) => okData(res) ?? [] },
  });
  const providersQuery = useGetV1ListProviders({
    query: {
      select: (res) => (res.status === 200 ? res.data : []),
    },
  });
  const connectable = new Set(
    toConnectableProviders(providersQuery.data ?? []).map((p) => p.id),
  );
  const expertsById = new Map(experts.map((expert) => [expert.id, expert]));

  function expertTitle(expertId: string) {
    return getExpertDisplayTitle(expertsById.get(expertId), locale);
  }

  const { mutate: grant, isPending: isGranting } = useGrantExpertCredentials({
    mutation: {
      onSuccess: (_response, { expertId }) =>
        invalidateExpertGrantQueries(queryClient, expertId),
      onError: () =>
        toast({
          title: t("Could not add integration", "无法添加集成"),
          variant: "destructive",
        }),
    },
  });

  function grantTo(
    item: ExpertSetupItem,
    credential: {
      id: string;
      provider?: string;
      service?: string;
      service_name?: string | null;
    },
  ) {
    // A row can name a credential without naming its provider, and half a
    // sentence is worse than a general one.
    const service = credential.provider
      ? serviceName({
          provider: credential.provider,
          service: credential.service,
          service_name: credential.service_name,
        })
      : t("this service", "此服务");
    const title = expertTitle(item.expert_id);
    grant(
      { expertId: item.expert_id, data: { credential_ids: [credential.id] } },
      {
        onSuccess: () =>
          toast({
            title: t(
              `${title} can now use ${service}`,
              `${title} 现在可以使用 ${service}`,
            ),
          }),
      },
    );
  }

  function allow(item: ExpertSetupItem) {
    if (!item.credential_id) return;
    grantTo(item, { id: item.credential_id, provider: item.providers[0] });
  }

  function connect(item: ExpertSetupItem) {
    setConnecting(item);
  }

  function closeConnect() {
    setConnecting(null);
  }

  function handleConnected(credential: CredentialsMetaResponse) {
    if (connecting) grantTo(connecting, credential);
    setConnecting(null);
  }

  return {
    items: itemsQuery.data ?? [],
    expertTitle,
    // While the provider list is still loading nothing is knowably
    // unconnectable, so rows offer Connect rather than flashing "Needs a
    // platform key". Once it has settled, a failed load means no provider
    // is known to be connectable and the rows say so.
    isConnectable: (item: ExpertSetupItem) =>
      providersQuery.isPending ||
      item.providers.some((provider) => connectable.has(provider)),
    connecting,
    connect,
    closeConnect,
    handleConnected,
    allow,
    isGranting,
  };
}

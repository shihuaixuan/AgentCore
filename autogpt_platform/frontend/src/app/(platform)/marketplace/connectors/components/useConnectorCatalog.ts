import {
  useGetV1ListCredentials,
  useGetV1ListProviders,
} from "@/app/api/__generated__/endpoints/integrations/integrations";
import { filterSystemCredentials } from "@/components/contextual/CredentialsInput/helpers";
import {
  filterConnectableProviders,
  sortByPopularity,
  toConnectableProviders,
} from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { serviceKey } from "@/components/contextual/IntegrationsPanel/helpers";
import { connectorCategory } from "./connectorCategories";

export function useConnectorCatalog({
  search,
  category,
  isLoggedIn,
}: {
  search: string;
  category: string | null;
  isLoggedIn: boolean;
}) {
  const providers = useGetV1ListProviders();
  const credentials = useGetV1ListCredentials({
    query: { enabled: isLoggedIn },
  });
  const all = toConnectableProviders(
    providers.data?.status === 200 ? providers.data.data : [],
  );
  const visible = sortByPopularity(
    filterConnectableProviders(all, search),
  ).filter(
    (provider) =>
      !category || connectorCategory(provider.serviceId) === category,
  );
  const linked =
    isLoggedIn && credentials.data?.status === 200
      ? new Set(filterSystemCredentials(credentials.data.data).map(serviceKey))
      : new Set<string>();

  return {
    providers: visible,
    linked,
    isLoading: providers.isLoading,
    isError:
      providers.isError ||
      (providers.data !== undefined && providers.data.status !== 200),
    refetch: providers.refetch,
  };
}

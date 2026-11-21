import { useGetV2ListConnections } from "@/app/api/__generated__/endpoints/mcp/mcp";
import { expertAccountKey, isCatalogAccount, listExpertAccounts } from "@/lib/mcp-catalog-connections";
import { useQuery } from "@tanstack/react-query";

export function useExpertAccountIDs(expertID: string, enabled = true) {
  return useQuery({
    queryKey: expertAccountKey(expertID),
    queryFn: ({ signal }) => listExpertAccounts(expertID, signal),
    enabled: !!expertID && enabled, refetchOnMount: "always", retry: false,
  });
}

export function useCatalogAccounts(connectorID: string, expertID?: string) {
  const accounts = useGetV2ListConnections({ query: { refetchOnMount: "always", retry: false } });
  const grants = useExpertAccountIDs(expertID ?? "");
  const rows = accounts.data?.status === 200 ? accounts.data.data.filter(isCatalogAccount).filter((row) => row.enabled && row.connector_id === connectorID) : [];
  const failed = accounts.isError || (!!accounts.data && accounts.data.status !== 200) || (!!expertID && grants.isError);
  const known = !failed && accounts.isFetchedAfterMount && !accounts.isFetching && (!expertID || (grants.isFetchedAfterMount && !grants.isFetching));
  return { rows, known, failed, granted: expertID ? grants.data ?? [] : rows.map((row) => row.id), retry() {
    void accounts.refetch();
    if (expertID) void grants.refetch();
  } };
}

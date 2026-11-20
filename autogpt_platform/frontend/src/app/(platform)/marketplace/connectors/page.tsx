import { Suspense } from "react";
import { MainMarketplacePageLoading } from "../components/MainMarketplacePageLoading";
import { ConnectorsBrowsePage } from "./components/ConnectorsBrowsePage";

export const metadata = { title: "Connectors - Duanmu Software Marketplace" };

export default function MarketplaceConnectorsPage() {
  return (
    <Suspense fallback={<MainMarketplacePageLoading />}>
      <ConnectorsBrowsePage />
    </Suspense>
  );
}

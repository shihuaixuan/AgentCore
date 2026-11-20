import { Suspense } from "react";
import { MainMarketplacePageLoading } from "../components/MainMarketplacePageLoading";
import { WorkflowsBrowsePage } from "./components/WorkflowsBrowsePage";

export const metadata = { title: "Workflows - Duanmu Software Marketplace" };

export default function MarketplaceWorkflowsPage() {
  return (
    <Suspense fallback={<MainMarketplacePageLoading />}>
      <WorkflowsBrowsePage />
    </Suspense>
  );
}

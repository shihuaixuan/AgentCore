import type { ReactNode } from "react";
import { MarketplaceNavigation } from "./components/MarketplaceNavigation";

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <MarketplaceNavigation />
      {children}
    </div>
  );
}

import { Metadata } from "next/types";
import { APIKeysSection } from "@/app/(platform)/profile/(user)/api-keys/components/APIKeySection/APIKeySection";
import { Card, CardContent, CardHeader } from "@/components/atoms/Card/Card";
import { APIKeysModals } from "./components/APIKeysModals/APIKeysModals";
import { APIKeysHeader } from "./components/APIKeysHeader";

export const metadata: Metadata = { title: "API Keys - Duanmu Software" };

const ApiKeysPage = () => {
  return (
    <div className="w-full pt-24 pr-4 md:pt-0">
      <Card variant="outlined">
        <CardHeader>
          <APIKeysHeader />
        </CardHeader>
        <CardContent>
          <APIKeysModals />
          <APIKeysSection />
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeysPage;

"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { ConnectServiceDialog } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/ConnectServiceDialog";
import type { ConnectableProvider } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { CustomMCPConnections } from "@/components/contextual/IntegrationsPanel/components/CustomMCPConnections/CustomMCPConnections";
import { useCustomMCPConnections } from "@/components/contextual/IntegrationsPanel/components/CustomMCPConnections/useCustomMCPConnections";
import { IntegrationsList } from "@/components/contextual/IntegrationsPanel/components/IntegrationsList/IntegrationsList";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BROWSE_LAYOUT,
  BrowseHeader,
} from "../../components/Browse/BrowseHeader";
import {
  BrowseMessage,
  BrowseSkeleton,
} from "../../components/Browse/BrowseResults";
import { useBrowseParams } from "../../components/Browse/useBrowseParams";
import { ConnectorCatalog } from "./ConnectorCatalog";
import { ConnectorPreview } from "./ConnectorPreview";

const LOGIN = `/login?next=${encodeURIComponent("/marketplace/connectors?view=mine")}`;

export function ConnectorsBrowsePage() {
  const { t } = useTranslation();
  const { isLoggedIn, isUserLoading } = useAuth();
  const router = useRouter();
  const { params, search, category, update } = useBrowseParams();
  const personal = params.get("view") === "mine";
  const custom = useCustomMCPConnections({ enabled: isLoggedIn && personal });
  const [selected, setSelected] = useState<ConnectableProvider | null>(null);
  const [connectionSearch, setConnectionSearch] = useState("");

  function addCustom() {
    if (!isLoggedIn) {
      router.push(LOGIN);
      return;
    }
    update({ view: "mine" });
    setConnectionSearch("");
    custom.create();
  }

  return (
    <main className={BROWSE_LAYOUT}>
      <BrowseHeader
        title={t("Connectors", "连接器")}
        description={t(
          "Connect the services your experts and workflows use.",
          "连接专家和工作流所需的外部服务。",
        )}
        search={
          personal
            ? undefined
            : {
                value: search,
                label: t("Search connectors", "搜索连接器"),
                onSubmit: (q) => update({ q }),
              }
        }
        action={
          <Button
            size="small"
            disabled={isUserLoading}
            leftIcon={<Icon icon={PlusSignIcon} size={16} />}
            onClick={addCustom}
          >
            {t("Add custom MCP", "添加自定义 MCP")}
          </Button>
        }
      />
      <div
        role="group"
        aria-label={t("Connector views", "连接器视图")}
        className="mb-4 flex flex-wrap gap-2 border-b border-border-base pb-3"
      >
        <Button
          size="small"
          variant={personal ? "ghost" : "secondary"}
          aria-pressed={!personal}
          onClick={() => update({ view: null })}
        >
          {t("Browse connectors", "浏览连接器")}
        </Button>
        <Button
          size="small"
          variant={personal ? "secondary" : "ghost"}
          aria-pressed={personal}
          onClick={() => update({ view: "mine" })}
        >
          {t("My connections", "我的连接")}
        </Button>
      </div>
      {personal ? (
        isUserLoading ? (
          <BrowseSkeleton label={t("Loading connections", "正在加载连接")} />
        ) : isLoggedIn ? (
          <IntegrationsList
            query={connectionSearch}
            onQueryChange={setConnectionSearch}
            stickyClassName="bg-surface"
            customConnections={custom}
          />
        ) : (
          <div className="space-y-3">
            <BrowseMessage
              message={t(
                "Sign in to view and manage your connections.",
                "登录后可以查看和管理你的连接。",
              )}
            />
            <Button as="NextLink" href={LOGIN} variant="secondary">
              {t("Sign in", "登录")}
            </Button>
          </div>
        )
      ) : (
        <ConnectorCatalog
          key={JSON.stringify([search, category])}
          search={search}
          category={category}
          isLoggedIn={isLoggedIn}
          onFilter={(value) => update({ category: value })}
          onSelect={setSelected}
          onReset={() => update({ q: null, category: null })}
        />
      )}
      {isLoggedIn && <CustomMCPConnections state={custom} />}
      {!isUserLoading && !isLoggedIn && selected && (
        <ConnectorPreview
          provider={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {isLoggedIn && selected && (
        <ConnectServiceDialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          initialProviderId={selected.id}
          onConnected={() => {
            setConnectionSearch("");
            update({ view: "mine" });
          }}
        />
      )}
    </main>
  );
}

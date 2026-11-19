import { useContext, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { getV1GetAyrshareSsoUrl } from "@/app/api/__generated__/endpoints/integrations/integrations";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { CredentialsActionsContext } from "@/providers/agent-credentials/credentials-provider";

export function useAyrshareConnect() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const credentialsActions = useContext(CredentialsActionsContext);

  async function connect() {
    setIsLoading(true);
    try {
      const { data, status } = await getV1GetAyrshareSsoUrl();
      if (status !== 200) {
        throw new Error(data.detail);
      }
      // The SSO endpoint provisions the managed Ayrshare credential as a
      // side effect — reload the credentials context so the block's
      // dropdown picks it up without a page refresh.
      credentialsActions?.reload();
      const popup = window.open(data.sso_url, "_blank", "popup=true");
      if (!popup) {
        throw new Error(
          t(
            "Please allow popups for this site to be able to login with Ayrshare",
            "请允许此网站打开弹出窗口，以登录 Ayrshare",
          ),
        );
      }
      toast({
        title: t("Success", "成功"),
        description: t(
          "Please complete the authentication in the popup window",
          "请在弹出窗口中完成身份验证",
        ),
      });
    } catch (error) {
      toast({
        title: t("Error", "错误"),
        description: t(
          `Error getting SSO URL: ${error}`,
          `获取 SSO 地址失败：${error}`,
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return { connect, isLoading };
}

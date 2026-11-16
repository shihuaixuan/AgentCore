import type { BlockIOCredentialsSubSchema } from "@/lib/autogpt-server-api/types";
import { getHostFromUrl } from "@/lib/utils/url";

const SERVICES: Partial<
  Record<
    string,
    {
      name: string;
      icon: string;
      keyHelp: string;
      keyHelpChinese: string;
      bearer: boolean;
    }
  >
> = {
  "api.linear.app": {
    name: "Linear",
    icon: "linear",
    keyHelp:
      "In Linear, open Settings → Account → Security & Access and create a personal API key. Give it access to the teams this workflow needs.",
    keyHelpChinese:
      "在 Linear 中打开“设置 → 账户 → 安全与访问”，创建个人 API 密钥，并授予其访问此工作流所需团队的权限。",
    bearer: false,
  },
  "api.github.com": {
    name: "GitHub",
    icon: "github",
    keyHelp:
      "Create a GitHub personal access token with access to the repositories and permissions this workflow needs.",
    keyHelpChinese:
      "创建 GitHub 个人访问令牌，并授予此工作流所需的仓库访问权限及其他权限。",
    bearer: true,
  },
};

export function credentialHosts(schema: BlockIOCredentialsSubSchema) {
  if (!schema.credentials_types?.includes("host_scoped")) return [];
  return [
    ...new Set(
      (schema.discriminator_values ?? []).flatMap((url) => {
        const host = getHostFromUrl(url);
        return host ? [host.toLowerCase()] : [];
      }),
    ),
  ].sort();
}

export function credentialService(schema: BlockIOCredentialsSubSchema) {
  if (schema.credentials_provider[0] !== "http") return undefined;
  const hosts = credentialHosts(schema);
  if (hosts.length !== 1) return undefined;
  return { host: hosts[0], ...SERVICES[hosts[0]] };
}

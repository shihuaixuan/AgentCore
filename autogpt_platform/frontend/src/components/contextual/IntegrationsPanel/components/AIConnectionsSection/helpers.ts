import type { AIConnectionOffer } from "@/app/api/__generated__/models/aIConnectionOffer";
import type { SetDefaultTransportRequest } from "@/app/api/__generated__/models/setDefaultTransportRequest";
import type { SetDefaultTransportRequestAuthProvider } from "@/app/api/__generated__/models/setDefaultTransportRequestAuthProvider";

export function isProviderLinked(
  offers: AIConnectionOffer[] | undefined,
  authProvider: string,
): boolean {
  return (offers ?? []).some(
    (offer) =>
      offer.auth_provider === authProvider && Boolean(offer.credential_id),
  );
}

const MICROSOFT_SCOPE_LABELS: Record<string, string> = {
  "User.Read": "Basic account profile",
  "Sites.Read.All": "SharePoint and OneDrive files",
  "Mail.Read": "Outlook mail",
  "People.Read.All": "People in your organization",
  "OnlineMeetingTranscript.Read.All": "Teams meeting transcripts",
  "Chat.Read": "Teams chats",
  "ChannelMessage.Read.All": "Teams channel messages",
  "ExternalItem.Read.All": "External Microsoft Search items",
  offline_access: "Stay connected",
  openid: "Sign-in identity",
  profile: "Basic account profile",
  email: "Email address",
};

export function microsoftAccessLabels(
  scopes: string[] | null | undefined,
  t: (english: string, chinese: string) => string = (english) => english,
): string[] {
  const chinese: Record<string, string> = {
    "User.Read": "基本账户资料",
    "Sites.Read.All": "SharePoint 和 OneDrive 文件",
    "Mail.Read": "Outlook 邮件",
    "People.Read.All": "组织中的人员",
    "OnlineMeetingTranscript.Read.All": "Teams 会议转录",
    "Chat.Read": "Teams 聊天",
    "ChannelMessage.Read.All": "Teams 频道消息",
    "ExternalItem.Read.All": "外部 Microsoft Search 项目",
    offline_access: "保持连接",
    openid: "登录身份",
    profile: "基本账户资料",
    email: "电子邮件地址",
  };
  return Array.from(
    new Set(
      (scopes ?? []).map((scope) =>
        t(MICROSOFT_SCOPE_LABELS[scope] ?? scope, chinese[scope] ?? scope),
      ),
    ),
  );
}

/**
 * The route to send when making a connection the default.
 *
 * The offer describes a connection; the default is set on the transport that
 * runs it, which is keyed by provider and credential. ``offer_id`` is built
 * server-side as ``{auth_provider}:{credential_id or "deployment"}``, so the
 * provider is recoverable from it without the client deciding anything.
 */
export function routeOf(offer: AIConnectionOffer): SetDefaultTransportRequest {
  return {
    auth_provider: offer.offer_id.split(
      ":",
    )[0] as SetDefaultTransportRequestAuthProvider,
    credential_id: offer.credential_id ?? null,
  };
}

/**
 * Whether this connection can be chosen as the default.
 *
 * A locked offer is listed so the user can see it exists and what unlocks it,
 * but it cannot be routed to, so it cannot be a default either.
 */
export function isSelectable(offer: AIConnectionOffer): boolean {
  return (
    offer.selectable &&
    (offer.auth_method === "deployment" || offer.credential_id !== null)
  );
}

/**
 * Every connection worth showing, selectable or not.
 *
 * A locked one earns its place by explaining an absence the user would
 * otherwise have to guess at.
 */
export function visibleOffers(
  offers: AIConnectionOffer[] | undefined,
): AIConnectionOffer[] {
  return (offers ?? []).filter(
    (offer) => isSelectable(offer) || Boolean(offer.lock_reason),
  );
}

/**
 * "Balanced: Sonnet 5 · Advanced: Opus 5".
 *
 * Empty when the server named no models, so the row omits the line rather
 * than rendering half of one.
 */
export function tierSummary(offer: AIConnectionOffer): string {
  const named = offer.tiers
    .filter((tier) => tier.display_model)
    .map((tier) => `${tier.label}: ${tier.display_model}`);
  return named.join(" · ");
}

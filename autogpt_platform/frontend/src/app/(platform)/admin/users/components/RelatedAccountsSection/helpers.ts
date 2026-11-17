import type { AccountIPReport } from "@/app/api/__generated__/models/accountIPReport";

export function getNoRelatedMessage({ ips, domain }: AccountIPReport) {
  if (domain.is_public_provider) {
    return ips.length === 0
      ? "No addresses on record, so no accounts are linked.|没有地址记录，因此没有关联账户。"
      : "No other accounts share this account's addresses.|没有其他账户与此账户共用地址。"
  }
  return ips.length === 0
    ? "No addresses on record, so related accounts are matched by email domain only: none.|没有地址记录；按邮箱域名匹配也未发现关联账户。"
    : "No other accounts share this account's addresses or email domain.|没有其他账户与此账户共用地址或邮箱域名。"
}

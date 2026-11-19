import { describe, expect, it } from "vitest";
import { auditUICopy } from "./audit-ui-copy";

describe("localization source audit", () => {
  it("detects app-owned JSX, attributes, fallback text and dynamic templates", () => {
    const findings = auditUICopy(
      'const View = () => <div><button>Chat with</button><input placeholder="What else can I help with?" />{name ?? "Unnamed expert"}<p>{`Completed ${count} tasks`}</p></div>',
    );
    expect(findings.map((finding) => finding.text)).toEqual([
      "Chat with",
      "What else can I help with?",
      "Unnamed expert",
      "Completed {value} tasks",
    ]);
  });

  it("does not mistake identifiers, styles, URLs, brands or user data for copy", () => {
    const findings = auditUICopy(
      'const View = () => <div className={active ? "flex items-center" : "hidden"} data-state="active"><input name="email" placeholder="https://example.com" /><span>{user.name}</span><span>{`${first} / ${second}`}</span><span>AutoGPT</span><code>npm install package</code>{t("English text", "中文文案")}<p>正在使用 Pro 套餐</p></div>',
    );
    expect(findings).toEqual([]);
  });

  it("finds mixed-language copy but accepts explicit localized branches and technical labels", () => {
    const findings = auditUICopy(
      'const View = () => <div>Chat with 凯西<span>正在使用 Microsoft 365 Copilot</span><span>{locale === "zh-CN" ? "已连接" : "Connected"}</span><p>{chinese ? "操作失败" : "Something went wrong"}</p><kbd>Ctrl</kbd><span>&middot;</span><span>recordingId</span><span>GET /onboarding/status</span></div>',
    );
    expect(findings.map((finding) => finding.text)).toEqual(["Chat with 凯西"]);
  });

  it("detects untranslated notification text without treating configuration descriptions as UI", () => {
    const findings = auditUICopy(
      'const configuration = { description: "Internal debug setting" }; toast({ title: "Preferences saved", description: `Deleted ${count} files` }); toast({ title: t("Retry", "重试"), description: error.message });',
    );
    expect(findings.map((finding) => finding.text)).toEqual([
      "Preferences saved",
      "Deleted {value} files",
    ]);
  });

  it("parses TypeScript generics as code while still checking notifications", () => {
    const findings = auditUICopy(
      'const request = <Result>(value: Result): Result => value; const result = request<string>("Internal value"); toast({ title: "Request failed" });',
      "request.ts",
    );
    expect(findings.map((finding) => finding.text)).toEqual(["Request failed"]);
  });
});

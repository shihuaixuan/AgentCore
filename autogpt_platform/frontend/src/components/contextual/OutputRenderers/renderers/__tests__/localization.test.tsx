import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { OutputActions } from "../../components/OutputActions";
import { audioRenderer } from "../AudioRenderer";
import { codeRenderer } from "../CodeRenderer";
import { csvRenderer } from "../CSVRenderer";
import { DesktopStreamPreview } from "../DesktopStreamRenderer";
import { htmlRenderer } from "../HTMLRenderer";
import { imageRenderer } from "../ImageRenderer";
import { jsonRenderer } from "../JSONRenderer";
import { markdownRenderer } from "../MarkdownRenderer";
import { videoRenderer } from "../VideoRenderer";
import { workspaceFileRenderer } from "../WorkspaceFileRenderer";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("localizes output actions without translating copied code or JSON", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  const code = 'const value = "Download All";';
  const data = { File: "Copy All", value: null };
  render(
    <LanguageProvider>
      <OutputActions
        isPrimary
        items={[
          { value: code, renderer: codeRenderer },
          { value: data, renderer: jsonRenderer },
        ]}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("全部复制")).toBeDefined();
  expect(screen.getByText("全部下载")).toBeDefined();
  expect(screen.getByRole("button", { name: "下载输出内容" })).toBeDefined();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "复制所有文本输出" }));
  });
  expect(writeText).toHaveBeenCalledWith(
    'const value = "Download All";\n\n{\n  "File": "Copy All",\n  "value": null\n}',
  );
  act(() => vi.runAllTimers());
});

test("retains English output actions outside a language provider", () => {
  render(<OutputActions isPrimary items={[]} />);
  expect(
    screen.getByRole("button", { name: "Copy all text outputs" }),
  ).toBeDefined();
  expect(screen.getByText("Download All")).toBeDefined();
});

test("localizes empty CSV while preserving headers and cell values", () => {
  const { rerender } = render(
    <LanguageProvider>{csvRenderer.render("")}</LanguageProvider>,
  );
  expect(screen.getByText("CSV 暂无数据")).toBeDefined();
  rerender(
    <LanguageProvider>
      {csvRenderer.render("File,Loading\nCopy All,undefined")}
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "File" })).toBeDefined();
  expect(screen.getByRole("cell", { name: "Copy All" })).toBeDefined();
  expect(screen.getByRole("cell", { name: "undefined" })).toBeDefined();
});

test("localizes HTML preview chrome but not document contents or export", () => {
  const html = "<h1>Loading</h1><pre>const value = null;</pre>";
  render(<LanguageProvider>{htmlRenderer.render(html)}</LanguageProvider>);
  expect(screen.getByTitle("HTML 预览").getAttribute("srcdoc")).toContain(html);
  expect(htmlRenderer.getCopyContent(html)?.data).toBe(html);
  expect(
    htmlRenderer.getDownloadContent(html, { filename: "Loading.html" })
      ?.filename,
  ).toBe("Loading.html");
});

test("localizes live desktop controls and warnings while preserving identifiers", () => {
  const value = {
    kind: "desktop_stream" as const,
    url: "https://desktop.example.com/view",
    provider: "Browserbase",
    sandbox_id: "Loading-null",
    requires_auth: true,
  };
  const { rerender } = render(
    <LanguageProvider>
      <DesktopStreamPreview value={value} />
    </LanguageProvider>,
  );
  expect(screen.getByText("交互式桌面")).toBeDefined();
  expect(screen.getByText("Browserbase")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "在新标签页中打开" }).getAttribute("href"),
  ).toBe(value.url);
  expect(screen.getByTitle("交互式桌面（Loading-null）")).toBeDefined();
  expect(screen.getByText(/请勿登录个人账号。/)).toBeDefined();
  rerender(
    <LanguageProvider>
      <DesktopStreamPreview value={value} ownerView={false} />
    </LanguageProvider>,
  );
  expect(screen.getByText("实时桌面仅对本聊天的所有者可见。")).toBeDefined();
  expect(screen.queryByRole("link")).toBeNull();
});

test("localizes media fallbacks and preserves URLs and filenames", () => {
  const { container } = render(
    <LanguageProvider>
      {audioRenderer.render("https://example.com/Loading.mp3")}
      {videoRenderer.render("https://example.com/Loading.mp4")}
      {videoRenderer.render("https://vimeo.com/12345")}
      {imageRenderer.render("https://example.com/Loading.png")}
      {imageRenderer.render("https://example.com/raw.png", {
        filename: "Loading.png",
      })}
      {markdownRenderer.render("![Raw clip](https://example.com/raw.mp4)")}
    </LanguageProvider>,
  );
  expect(screen.getByText("您的浏览器不支持音频播放。")).toBeDefined();
  expect(screen.getAllByText("您的浏览器不支持视频播放。")).toHaveLength(2);
  expect(screen.getByTitle("Vimeo 视频")).toBeDefined();
  expect(
    screen.getByRole("img", { name: "输出图片" }).getAttribute("src"),
  ).toBe("https://example.com/Loading.png");
  expect(screen.getByRole("img", { name: "Loading.png" })).toBeDefined();
  expect(container.querySelector("audio source")?.getAttribute("src")).toBe(
    "https://example.com/Loading.mp3",
  );
});

test("localizes workspace file chrome without translating file data", () => {
  render(
    <LanguageProvider>
      {workspaceFileRenderer.render("workspace://raw-id#application/pdf")}
      {workspaceFileRenderer.render("workspace://other-id", {
        filename: "Loading.txt",
      })}
      {workspaceFileRenderer.render("workspace://image-id#image/png")}
    </LanguageProvider>,
  );
  expect(screen.getByText("PDF 文件")).toBeDefined();
  expect(screen.getByText("Loading.txt")).toBeDefined();
  expect(screen.getByText("application/pdf")).toBeDefined();
  expect(
    screen.getAllByRole("link", { name: "下载文件" })[0].getAttribute("href"),
  ).toBe("/api/proxy/api/workspace/files/raw-id/download");
  expect(screen.getByRole("img", { name: "图片" })).toBeDefined();
});

test("keeps JSON syntax and user values intact under Chinese locale", () => {
  render(
    <LanguageProvider>
      {jsonRenderer.render({ Loading: [null, undefined, true, "Copy All"] })}
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "对象" })).toBeDefined();
  expect(screen.getByRole("button", { name: "数组（4）" })).toBeDefined();
  expect(screen.getByText("null")).toBeDefined();
  expect(screen.getByText("undefined")).toBeDefined();
  expect(screen.getByText("true")).toBeDefined();
  expect(screen.getByText('"Copy All"')).toBeDefined();
});

test("localizes code preview chrome without translating the source or filename", () => {
  const code = 'const value = "Generate";';
  const { rerender } = render(
    <LanguageProvider>{codeRenderer.render(code)}</LanguageProvider>,
  );
  expect(screen.getByText("代码")).toBeDefined();
  expect(screen.getByText(code)).toBeDefined();
  expect(codeRenderer.getCopyContent(code)?.data).toBe(code);
  rerender(
    <LanguageProvider>
      {codeRenderer.render(code, { filename: "code.ts" })}
    </LanguageProvider>,
  );
  expect(screen.getByText("code.ts")).toBeDefined();
});

test("uses English preview chrome when explicitly requested", () => {
  render(
    <LanguageProvider initialLocale="en">
      {csvRenderer.render("")}
      {htmlRenderer.render("<h1>原文</h1>")}
      {imageRenderer.render("https://example.com/image.png")}
    </LanguageProvider>,
  );
  expect(screen.getByText("Empty CSV")).toBeDefined();
  expect(screen.getByTitle("HTML preview")).toBeDefined();
  expect(screen.getByRole("img", { name: "Output image" })).toBeDefined();
});

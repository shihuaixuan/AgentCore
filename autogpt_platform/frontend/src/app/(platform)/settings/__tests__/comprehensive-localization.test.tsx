import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { NotificationsCard } from "../account/components/NotificationsCard/NotificationsCard";
import { BrowserNotificationsCard } from "../account/components/BrowserNotificationsCard/BrowserNotificationsCard";
import { LinksSection } from "../profile/components/LinksSection/LinksSection";
import { ProfileForm } from "../profile/components/ProfileForm/ProfileForm";
import { validateForm } from "../profile/helpers";
import { Pagination } from "../creator-dashboard/components/Pagination/Pagination";
import { APIKeysHeader } from "../api-keys/components/APIKeysHeader/APIKeysHeader";
import { APIKeySelectionBar } from "../api-keys/components/APIKeySelectionBar/APIKeySelectionBar";
import { LearningHistoryCard } from "../memory/components/LearningHistoryCard";
import { ScopeCard } from "../memory/components/ScopeCard";
import SettingsOAuthAppsPage from "../oauth-apps/page";
import { PermissionsCheckboxGroup } from "../api-keys/components/CreateAPIKeyDialog/components/PermissionsCheckboxGroup";
import { CreateAPIKeyDialog } from "../api-keys/components/CreateAPIKeyDialog/CreateAPIKeyDialog";
import { SubmissionsList } from "../creator-dashboard/components/SubmissionsList/SubmissionsList";
import { MobileSubmissionsList } from "../creator-dashboard/components/MobileSubmissionsList/MobileSubmissionsList";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import type { APIKeyPermission } from "@/app/api/__generated__/models/aPIKeyPermission";
import { ColumnFilter } from "../creator-dashboard/components/ColumnFilter/ColumnFilter";
import type { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";

const profile = {
  name: "Jane Doe",
  username: "jane_doe",
  description: "My workflow",
  avatar_url: "",
  links: [{ id: "link-1", value: "https://example.com/Jane" }],
};

describe("settings comprehensive Chinese localization", () => {
  test("translates notification explanations and frequency labels", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <NotificationsCard
          values={{
            briefingFrequency: "WEEKLY",
            alertsEnabled: true,
            storeVerdictsEnabled: true,
          }}
          onBriefingFrequencyChange={vi.fn()}
          onAlertsChange={vi.fn()}
          onStoreVerdictsChange={vi.fn()}
        />
        <BrowserNotificationsCard />
      </LanguageProvider>,
    );
    expect(
      screen.getByText(
        "账单和账户消息始终会发送——这些是账户相关消息，而非推广。 ".trim(),
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: "简报" }).textContent,
    ).toContain("每周");
    expect(screen.getByText("浏览器")).toBeDefined();
    expect(
      screen.getByText("按设备设置。在此处开启不会同步到手机或其他浏览器。"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "仅在有事项等待你处理时提醒，运行成功时不会提醒。每天最多两次。",
      ),
    ).toBeDefined();
  });

  test("translates profile controls without altering user links or bio", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <LinksSection
          links={profile.links}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onChange={vi.fn()}
        />
        <ProfileForm formState={profile} errors={{}} onChange={onChange} />
      </LanguageProvider>,
    );
    expect(
      (screen.getByRole("textbox", { name: "链接 1" }) as HTMLInputElement)
        .value,
    ).toBe("https://example.com/Jane");
    expect(screen.getByRole("button", { name: "移除链接 1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "添加链接" })).toBeDefined();
    expect(
      screen.getByText(
        "最多可添加 5 个链接。网站、GitHub、X，或其他希望公开的内容。",
      ),
    ).toBeDefined();
    expect(screen.getByText("剩余 269 个字符")).toBeDefined();
    expect(screen.getByRole("button", { name: "粗体" }).title).toBe("粗体");
    fireEvent.click(screen.getByRole("button", { name: "预览" }));
    expect(screen.getByText("My workflow")).toBeDefined();
    expect(screen.getByRole("button", { name: "编辑" })).toBeDefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("translates link limits and preserves English outside the provider", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <LinksSection
          links={Array.from({ length: 5 }, (_, index) => ({
            id: `link-${index}`,
            value: "",
          }))}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onChange={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "已达到 5 个链接的上限",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  test("translates pagination counts and accessible names, preserving page values", () => {
    const onPageChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Pagination
          pagination={{
            current_page: 2,
            total_pages: 4,
            total_items: 35,
            page_size: 10,
          }}
          onPageChange={onPageChange}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("显示第 11–20 项，共 35 项")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "转到第 3 页" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("translates API guidance and selection templates without changing docs URL", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <APIKeysHeader onCreate={vi.fn()} />
        <APIKeySelectionBar
          selectedCount={3}
          allSelected={false}
          onSelectAll={vi.fn()}
          onDeselectAll={vi.fn()}
          onDeleteSelected={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("已选择 3 项")).toBeDefined();
    expect(
      screen.getByText(/管理允许外部工具访问 AutoGPT 账户的 API 密钥/),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "API 文档" }).getAttribute("href"),
    ).toBe("https://agpt.co/docs/platform/api-and-integrations/api-guide");
  });

  test("translates memory explanations, filter labels and empty state", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ScopeCard scopeExpertID={null} experts={[]} onSelect={vi.fn()} />
        <LearningHistoryCard
          items={[]}
          isLoading={false}
          experts={[]}
          origin="all"
          state="all"
          onOriginChange={vi.fn()}
          onStateChange={vi.fn()}
          onOpen={vi.fn()}
        />
        <SettingsOAuthAppsPage />
      </LanguageProvider>,
    );
    expect(
      screen.getByText("选择要查看谁的记忆。每位专家都有自己的记忆。"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "夜间学习改变了什么、依据来自哪里，以及哪些内容未被学习。",
      ),
    ).toBeDefined();
    expect(
      screen.getByText("尚无学习记录。安静的一夜意味着没有需要调整的内容。"),
    ).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: "来源" }).textContent,
    ).toContain("所有来源");
    expect(
      screen.getByRole("combobox", { name: "状态" }).textContent,
    ).toContain("所有状态");
    expect(screen.getByText("OAuth 应用")).toBeDefined();
    expect(screen.getByText("即将推出。")).toBeDefined();
  });

  test("keeps application copy in English without a provider", () => {
    render(
      <LinksSection
        links={profile.links}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Add link" })).toBeDefined();
    expect(
      (screen.getByRole("textbox", { name: "Link 1" }) as HTMLInputElement)
        .value,
    ).toBe("https://example.com/Jane");
  });

  test("localizes validation while leaving names, handles and limits unchanged", () => {
    expect(
      validateForm(
        { ...profile, name: "", username: "!", description: "文".repeat(281) },
        "zh-CN",
      ).errors,
    ).toEqual({
      name: "请输入显示名称",
      username: "请使用 2–30 个字母、数字、下划线或连字符",
      description: "简介不能超过 280 个字符",
    });
    expect(validateForm({ ...profile, name: "" }).errors.name).toBe(
      "Display name is required",
    );
  });

  test("propagates locale changes into permission names and explanations without changing values", () => {
    function Permissions() {
      const { setLocale } = useTranslation();
      const [value, setValue] = useState<APIKeyPermission[]>([]);
      return (
        <>
          <PermissionsCheckboxGroup value={value} onChange={setValue} />
          <button onClick={() => setLocale("en")}>English</button>
          <output>{value.join(",")}</output>
        </>
      );
    }
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Permissions />
      </LanguageProvider>,
    );
    expect(screen.getByText("运行你的工作流")).toBeDefined();
    expect(
      screen.getByRole("group", { name: "仅 API v1（2027-02-01 停止支持）" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("checkbox", { name: "执行工作流" }));
    expect(screen.getByRole("status").textContent).toBe("EXECUTE_GRAPH");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("Run your workflows")).toBeDefined();
    expect(
      screen
        .getByRole("checkbox", { name: "Execute Graph" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  test("translates the API key creation dialog title", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <CreateAPIKeyDialog open onOpenChange={vi.fn()} />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "创建 API 密钥" }),
    ).toBeDefined();
  });

  test.each([SubmissionsList, MobileSubmissionsList])(
    "translates submission count and empty search results while preserving the query",
    (List) => {
      const onSearchChange = vi.fn();
      render(
        <LanguageProvider initialLocale="zh-CN">
          <List
            submissions={[]}
            totalCount={12}
            filterState={{ statuses: [], sortKey: null, sortDir: "desc" }}
            onFilterChange={vi.fn()}
            onResetFilters={vi.fn()}
            searchInput="My workflow"
            onSearchChange={onSearchChange}
            debouncedSearch="My workflow"
            onView={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </LanguageProvider>,
      );
      expect(screen.getByText("显示 0 项，共 12 项")).toBeDefined();
      expect(
        screen.getByText("没有与“My workflow”匹配的提交记录"),
      ).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "清除搜索" }));
      expect(onSearchChange).toHaveBeenCalledWith("");
    },
  );

  test("translates the column filter accessible name", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ColumnFilter label="状态" active={false}>
          My filter
        </ColumnFilter>
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: "筛选状态" })).toBeDefined();
  });

  test.each([SubmissionsList, MobileSubmissionsList])(
    "translates deletion confirmations and keeps the selected submission ID",
    async (List) => {
      const submission: StoreSubmission = {
        listing_id: "listing-1",
        user_id: "user-1",
        slug: "my-workflow",
        listing_version_id: "version-1",
        listing_version: 1,
        graph_id: "graph-1",
        graph_version: 1,
        name: "My workflow",
        sub_heading: "My summary",
        description: "Original description",
        instructions: null,
        categories: [],
        image_urls: [],
        video_url: null,
        agent_output_demo_url: null,
        submitted_at: new Date("2026-11-01T12:00:00Z"),
        changes_summary: null,
        status: "PENDING",
        run_count: 12,
        review_count: 0,
        review_avg_rating: 0,
      };
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(
        <LanguageProvider initialLocale="zh-CN">
          <List
            submissions={[submission]}
            totalCount={1}
            filterState={{ statuses: [], sortKey: null, sortDir: "desc" }}
            onFilterChange={vi.fn()}
            onResetFilters={vi.fn()}
            searchInput=""
            onSearchChange={vi.fn()}
            debouncedSearch=""
            onView={vi.fn()}
            onEdit={vi.fn()}
            onDelete={onDelete}
          />
        </LanguageProvider>,
      );
      expect(screen.getByText("审核中")).toBeDefined();
      fireEvent.pointerDown(screen.getByRole("button", { name: "提交操作" }), {
        button: 0,
      });
      fireEvent.click(await screen.findByRole("menuitem", { name: "删除" }));
      expect(screen.getByRole("dialog").textContent).toContain(
        "将从市场移除 My workflow。此操作无法撤销。",
      );
      fireEvent.click(screen.getByRole("button", { name: "删除提交" }));
      expect(onDelete).toHaveBeenCalledWith("version-1");
    },
  );
});

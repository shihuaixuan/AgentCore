import { describe, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { OAuthAppsSection } from "../(user)/oauth-apps/components/OAuthAppsSection";
import { APIKeysModals } from "../(user)/api-keys/components/APIKeysModals/APIKeysModals";
import { APIKeysSection } from "../(user)/api-keys/components/APIKeySection/APIKeySection";
import { EmptySubmissions } from "../(user)/dashboard/components/MainDashboardPage/components/EmptySubmissions";
import { SubmissionLoadError } from "../(user)/dashboard/components/MainDashboardPage/components/SumbmissionLoadError";
import { SubmissionStatus } from "../(user)/dashboard/components/SubmissionStatus/SubmissionStatus";
import { NotificationForm } from "../(user)/settings/components/SettingsForm/components/NotificationForm/NotificationForm";
import { TimezoneForm } from "../(user)/settings/components/SettingsForm/components/TimezoneForm/TimezoneForm";
import CreditsPage from "../(user)/credits/page";
import { SubscriptionTierSection } from "../(user)/credits/components/SubscriptionTierSection/SubscriptionTierSection";
import type { User } from "@/lib/auth/types";
import ApiKeysPage from "../(user)/api-keys/page";
import OAuthAppsPage from "../(user)/oauth-apps/page";
import { ProfileSidebar } from "../(user)/components/ProfileSidebar/ProfileSidebar";
import { AgentTableCard } from "../(user)/dashboard/components/AgentTableCard/AgentTableCard";
import { AgentTableRow } from "../(user)/dashboard/components/AgentTableRow/AgentTableRow";
import type { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";

const toastSpy = vi.hoisted(() => vi.fn());
vi.mock("@/components/molecules/Toast/use-toast", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/molecules/Toast/use-toast")
  >()),
  useToast: () => ({ toast: toastSpy }),
}));
const app = {
  id: "app-1",
  name: "My OAuth App",
  description: "My custom description",
  client_id: "client-abc",
  is_active: true,
  created_at: "2026-01-01",
  logo_url: "https://example.com/logo.png",
};
vi.mock("@/app/api/__generated__/endpoints/oauth/oauth", () => ({
  useGetOauthListMyOauthApps: () => ({ data: [app], isLoading: false }),
  usePatchOauthUpdateAppStatus: () => ({
    mutateAsync: async () => ({ status: 200, data: { is_active: false } }),
  }),
  getGetOauthListMyOauthAppsQueryKey: () => ["oauth-apps"],
}));
vi.mock("@/app/api/__generated__/endpoints/api-keys/api-keys", () => ({
  usePostV1CreateNewApiKey: () => ({ mutateAsync: vi.fn() }),
  useDeleteV1RevokeApiKey: () => ({ mutateAsync: vi.fn() }),
  useGetV1ListUserApiKeys: () => ({
    data: [
      {
        id: "key-1",
        name: "My production key",
        head: "agpt_123",
        tail: "456",
        status: "ACTIVE",
        created_at: "2026-01-01",
        last_used_at: null,
      },
    ],
    isLoading: false,
  }),
  getGetV1ListUserApiKeysQueryKey: () => ["api-keys"],
}));
vi.mock("@/hooks/useCredits", () => ({
  default: () => ({
    requestTopUp: vi.fn(),
    updateAutoTopUpConfig: vi.fn(),
    autoTopUpConfig: { amount: 1000, threshold: 500 },
    transactionHistory: { transactions: [] },
    fetchTransactionHistory: vi.fn(),
    formatCredits: String,
    refundTopUp: vi.fn(),
    refundRequests: [],
  }),
}));
vi.mock("@/hooks/usePlatformPayment", () => ({
  usePlatformPayment: () => ({ isPaymentEnabled: true }),
}));
vi.mock(
  "@/app/api/__generated__/endpoints/credits/credits",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/api/__generated__/endpoints/credits/credits")
    >()),
    useGetSubscriptionStatus: () => ({
      data: {
        tier: "PRO",
        tier_costs: { BASIC: 1000, PRO: 2000, MAX: 10000 },
        tier_multipliers: { BASIC: 1, PRO: 2, MAX: 5 },
        has_active_stripe_subscription: true,
      },
      isLoading: false,
      refetch: vi.fn(),
    }),
    useUpdateSubscriptionTier: () => ({ mutateAsync: vi.fn() }),
  }),
);

const user = { id: "user-1", email: "jane@example.com" } as User;
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

describe("legacy profile localized surfaces", () => {
  test("translates OAuth actions and status without changing app-owned values", async () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <OAuthAppsSection />
      </LanguageProvider>,
    );
    expect(screen.getByText("My OAuth App")).toBeDefined();
    expect(screen.getByText("My custom description")).toBeDefined();
    expect(screen.getByText("client-abc")).toBeDefined();
    expect(screen.getByText("已启用")).toBeDefined();
    expect(screen.getByAltText("My OAuth App 标志").getAttribute("src")).toBe(
      "https://example.com/logo.png",
    );
    expect(screen.getByRole("button", { name: "更换标志" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "禁用" }));
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "成功",
          description: "应用已成功禁用",
        }),
      ),
    );
  });

  test("translates legacy API tables and create form labels, keeping masked keys", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <APIKeysSection />
        <APIKeysModals />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("columnheader", { name: "上次使用" }),
    ).toBeDefined();
    expect(screen.getByText("My production key")).toBeDefined();
    expect(screen.getByText("agpt_123******************456")).toBeDefined();
    expect(screen.getByText("从未使用")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "创建密钥" }));
    expect(
      screen.getByRole("heading", { name: "创建新 API 密钥" }),
    ).toBeDefined();
    expect(
      screen.getByPlaceholderText("我的 AutoGPT 平台 API 密钥"),
    ).toBeDefined();
    expect(screen.getByText("描述（可选）")).toBeDefined();
  });

  test("translates dashboard errors, empty states and status labels", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <EmptySubmissions />
        <SubmissionLoadError />
        <SubmissionStatus status="PENDING" />
      </LanguageProvider>,
    );
    expect(screen.getByText("尚未提交任何工作流")).toBeDefined();
    expect(screen.getByText("加载工作流失败")).toBeDefined();
    expect(screen.getByRole("button", { name: "重试" })).toBeDefined();
    expect(screen.getByText("等待审核")).toBeDefined();
  });

  test("translates legacy notification and timezone forms", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <NotificationForm
          user={user}
          preferences={{
            user_id: "user-1",
            email: "jane@example.com",
            briefing_frequency: "WEEKLY",
            alerts_enabled: true,
            store_verdicts_enabled: true,
            daily_limit: 0,
          }}
        />
        <TimezoneForm user={user} currentTimezone="Asia/Shanghai" />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("combobox", { name: "简报频率" }).textContent,
    ).toContain("每周");
    expect(screen.getByRole("switch", { name: "提醒" })).toBeDefined();
    expect(screen.getByRole("button", { name: "保存偏好" })).toBeDefined();
    expect(screen.getByRole("button", { name: "保存时区" })).toBeDefined();
    expect(screen.getByText("选择你的时区")).toBeDefined();
  });

  test("translates legacy billing guidance and subscription actions", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <CreditsPage />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "账单" })).toBeDefined();
    expect(screen.getByText("充值金额（USD），最低 $5：")).toBeDefined();
    expect(screen.getByPlaceholderText("输入充值金额")).toBeDefined();
    expect(screen.getByRole("button", { name: "打开账单门户" })).toBeDefined();
    expect(screen.getByText("未找到交易记录。")).toBeDefined();
    expect(screen.getByRole("button", { name: "升级至 Max" })).toBeDefined();
    expect(
      screen.getByText("为每天或每周运行更多任务提供专家容量"),
    ).toBeDefined();
  });

  test("uses localized tier names consistently in subscription cards and confirmations", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <SubscriptionTierSection />
      </LanguageProvider>,
    );
    expect(screen.getByText("基础版")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "降级至 基础版" }));
    expect(screen.getByRole("dialog").textContent).toContain(
      "切换至 基础版 将在当前账单周期结束时生效",
    );
    expect(screen.getByRole("button", { name: "确认降级" })).toBeDefined();
  });

  test("translates the legacy API page header and preserves the default English header", () => {
    const view = render(
      <LanguageProvider initialLocale="zh-CN">
        <ApiKeysPage />
      </LanguageProvider>,
    );
    expect(screen.getByText("AutoGPT 平台 API 密钥")).toBeDefined();
    expect(
      screen.getByText("管理用于程序化访问的 AutoGPT 平台 API 密钥"),
    ).toBeDefined();
    view.unmount();
    render(<ApiKeysPage />);
    expect(screen.getByText("AutoGPT Platform API Keys")).toBeDefined();
  });

  test("translates the OAuth page heading without changing app data", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <OAuthAppsPage />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "OAuth 应用" })).toBeDefined();
    expect(
      screen.getByText("管理使用 AutoGPT 平台 API 的 OAuth 应用"),
    ).toBeDefined();
    expect(screen.getByText("My OAuth App")).toBeDefined();
  });

  test("translates the sidebar accessible name and preserves supplied link text and target", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ProfileSidebar
          links={[
            { text: "My custom link", href: "/profile/settings", icon: null },
          ]}
        />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("button", { name: "打开侧边栏菜单" }),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole("link", { name: "My custom link" })[0]
        .getAttribute("href"),
    ).toBe("/profile/settings");
  });

  test("translates legacy submission cards and row actions without altering workflow data", async () => {
    const onView = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <AgentTableCard
          storeAgentSubmission={submission}
          onViewSubmission={onView}
        />
        <AgentTableRow
          storeAgentSubmission={submission}
          onViewSubmission={onView}
          onDeleteSubmission={vi.fn()}
          onEditSubmission={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("12 次运行")).toBeDefined();
    expect(screen.getByText("暂无评价")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "查看 My workflow" }));
    expect(onView).toHaveBeenCalledWith(submission);
    fireEvent.pointerDown(screen.getByTestId("agent-table-row-actions"), {
      button: 0,
    });
    expect(await screen.findByRole("menuitem", { name: "编辑" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeDefined();
    expect(screen.getAllByText("Original description")).toHaveLength(2);
  });

  test("localizes oversized logo errors before any upload request", async () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <OAuthAppsSection />
      </LanguageProvider>,
    );
    const file = new File(["x"], "My logo.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 4 * 1024 * 1024 });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "文件过大",
          description: "文件过大（4.0 MB）。最大允许 3 MB，请选择较小的文件。",
        }),
      ),
    );
  });
});

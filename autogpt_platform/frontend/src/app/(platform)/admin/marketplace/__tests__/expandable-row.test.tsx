import type { StoreListingWithVersionsAdminView } from "@/app/api/__generated__/models/storeListingWithVersionsAdminView";
import type { StoreSubmissionAdminView } from "@/app/api/__generated__/models/storeSubmissionAdminView";
import { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test, vi } from "vitest";
import { ExpandableRow } from "../components/ExpandleRow";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin/marketplace",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function submission(status: SubmissionStatus): StoreSubmissionAdminView {
  return {
    listing_id: "listing-1",
    user_id: "user-1",
    slug: "weekly-report",
    listing_version_id: "version-1",
    listing_version: 1,
    graph_id: "graph-1",
    graph_version: 1,
    name: "Weekly report",
    sub_heading: "Drafts the Monday status report",
    description: "",
    instructions: null,
    categories: [],
    image_urls: [],
    video_url: null,
    agent_output_demo_url: null,
    submitted_at: null,
    changes_summary: null,
    status,
    internal_comments: null,
  };
}

function renderRow(status: SubmissionStatus, locale?: Locale) {
  const latestVersion = submission(status);
  const listing: StoreListingWithVersionsAdminView = {
    listing_id: "listing-1",
    graph_id: "graph-1",
    slug: "weekly-report",
    creator_email: "creator@example.com",
    latest_version: latestVersion,
    versions: [latestVersion],
  };
  const row = (
    <table>
      <tbody>
        <ExpandableRow listing={listing} latestVersion={latestVersion} />
      </tbody>
    </table>
  );
  render(
    locale ? (
      <LanguageProvider initialLocale={locale}>{row}</LanguageProvider>
    ) : (
      row
    ),
  );
}

describe("ExpandableRow status badge", () => {
  test("shows a submission waiting for review as Pending", () => {
    renderRow(SubmissionStatus.PENDING);
    expect(screen.getByText("Pending")).toBeDefined();
  });

  test("shows a rejected submission as Rejected", () => {
    renderRow(SubmissionStatus.REJECTED);
    expect(screen.getByText("Rejected")).toBeDefined();
  });

  test("shows an approved submission as Approved", () => {
    renderRow(SubmissionStatus.APPROVED);
    expect(screen.getByText("Approved")).toBeDefined();
  });

  test("shows a submission that was never sent for review as Draft", () => {
    renderRow(SubmissionStatus.DRAFT);
    expect(screen.getByText("Draft")).toBeDefined();
  });

  test.each([
    { status: SubmissionStatus.PENDING, label: "待处理" },
    { status: SubmissionStatus.APPROVED, label: "已通过" },
    { status: SubmissionStatus.REJECTED, label: "已拒绝" },
    { status: SubmissionStatus.DRAFT, label: "草稿" },
  ])(
    "localizes $status in the Chinese summary and history",
    ({ status, label }) => {
      renderRow(status, "zh-CN");
      expect(screen.getByText(label)).toBeDefined();
      fireEvent.click(screen.getByText("Weekly report"));
      expect(screen.getByText("版本历史")).toBeDefined();
      expect(screen.getAllByText(label)).toHaveLength(2);
      expect(screen.getAllByText("Weekly report")).toHaveLength(2);
    },
  );

  test("keeps English in expanded history without a language provider", () => {
    renderRow(SubmissionStatus.DRAFT);
    fireEvent.click(screen.getByText("Weekly report"));
    expect(screen.getByText("Version History")).toBeDefined();
    expect(screen.getAllByText("Draft")).toHaveLength(2);
  });
});

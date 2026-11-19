import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { DateTimeInput } from "@/components/atoms/DateTimeInput/DateTimeInput";
import { InformationTooltip } from "../InformationTooltip/InformationTooltip";
import { ShowMore } from "../ShowMore/ShowMore";
import { ShowMoreText } from "../ShowMoreText/ShowMoreText";
import { Table } from "../Table/Table";
import { ScrollArea } from "../ScrollArea/ScrollArea";

test("localizes expandable text controls without translating user text", () => {
  render(
    <LanguageProvider>
      <ShowMore previewLimit={4}>Loading is user text</ShowMore>
      <ShowMoreText previewLimit={4}>Copy All is user text</ShowMoreText>
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "更多" }));
  expect(
    screen.getByText("Loading is user text", { exact: false }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "收起" }));
  fireEvent.click(screen.getByRole("button", { name: "显示更多" }));
  expect(
    screen.getByText("Copy All is user text", { exact: false }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "收起内容" })).toBeDefined();
});

test("localizes table actions and placeholder while retaining column names and edits", () => {
  const onChange = vi.fn();
  render(
    <LanguageProvider>
      <Table
        columns={["Loading"]}
        defaultValues={[{ Loading: "Copy All" }]}
        onChange={onChange}
      />
    </LanguageProvider>,
  );
  const input = screen.getByRole("textbox", { name: "Loading" });
  expect(input.getAttribute("placeholder")).toBe("输入 Loading");
  expect((input as HTMLInputElement).value).toBe("Copy All");
  fireEvent.change(input, { target: { value: "null/Loading.txt" } });
  expect(onChange).toHaveBeenLastCalledWith([{ Loading: "null/Loading.txt" }]);
  expect(screen.getByRole("button", { name: "删除行" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "添加行" }));
  expect(screen.getAllByRole("textbox", { name: "Loading" })).toHaveLength(2);
});

test("retains caller-owned table labels and English fallback", () => {
  render(
    <Table
      columns={["Name"]}
      defaultValues={[{ Name: "原文" }]}
      addRowLabel="Custom add"
    />,
  );
  expect(screen.getByRole("button", { name: "Delete row" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Custom add" })).toBeDefined();
  expect(screen.getByPlaceholderText("Enter name")).toBeDefined();
});

test("localizes information trigger without rewriting its description", async () => {
  render(
    <LanguageProvider>
      <InformationTooltip description="**Loading** is documentation" />
    </LanguageProvider>,
  );
  fireEvent.focus(screen.getByRole("button", { name: "更多信息" }));
  expect((await screen.findByRole("tooltip")).textContent).toBe(
    "Loading is documentation",
  );
});

test("localizes date and time prompts while retaining the ISO callback format", async () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <LanguageProvider>
      <DateTimeInput onChange={onChange} />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "选择日期和时间" })).toBeDefined();
  rerender(
    <LanguageProvider>
      <DateTimeInput
        value="2026-11-18T13:30"
        label="Start"
        onChange={onChange}
      />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button"));
  const time = await screen.findByLabelText("时间");
  fireEvent.change(time, { target: { value: "14:45" } });
  expect(onChange).toHaveBeenLastCalledWith("2026-11-18T14:45");
});

test("localizes the scroll-to-top accessible name", async () => {
  const { container } = render(
    <LanguageProvider>
      <ScrollArea showScrollToTop>
        <div>Raw Loading</div>
      </ScrollArea>
    </LanguageProvider>,
  );
  const viewport = container.querySelector(
    '[data-slot="scroll-area-viewport"]',
  ) as HTMLElement;
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    value: 300,
  });
  fireEvent.scroll(viewport);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "返回顶部" })).toBeDefined(),
  );
});

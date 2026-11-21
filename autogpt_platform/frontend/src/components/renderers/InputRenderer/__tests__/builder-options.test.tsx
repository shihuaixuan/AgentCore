import type { RJSFSchema } from "@rjsf/utils";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render } from "@/tests/integrations/test-utils";
import { FormRenderer } from "../FormRenderer";

it("shows authored names on selected boolean options without using those names as keys", async () => {
  const change = vi.fn();
  const { container } = render(
    <LanguageProvider>
      <FormRenderer
        jsonSchema={{
          type: "object",
          properties: {
            options: {
              type: "object",
              properties: {
                first_flag: { type: "boolean", title: "第一项" },
                second_flag: { type: "boolean", title: "第二项" },
              },
            },
          },
        }}
        handleChange={change}
        uiSchema={{}}
        initialValues={{ options: { first_flag: false, second_flag: true } }}
        formContext={{ isBuilderNode: true, showHandles: false }}
      />
    </LanguageProvider>,
  );
  expect(
    container.querySelector('[data-slot="multi-select-badge-label"]')
      ?.textContent,
  ).toBe("第二项");
  fireEvent.focus(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByRole("option", { name: "第一项" }));
  await waitFor(() =>
    expect(change.mock.lastCall?.[0].formData).toEqual({
      options: { first_flag: true, second_flag: true },
    }),
  );
});

it("uses a localized item title for an untitled array entry, not its stored value", () => {
  render(
    <LanguageProvider>
      <FormRenderer
        jsonSchema={{
          type: "object",
          properties: { rows: { type: "array", items: { type: "string" } } },
        }}
        handleChange={vi.fn()}
        uiSchema={{}}
        initialValues={{ rows: ["Item 1"] }}
        formContext={{ isBuilderNode: true, showHandles: false }}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("textbox", { name: "项目 1" })).toBe(
    screen.getByDisplayValue("Item 1"),
  );
});

it("keeps each multi-select value addressable when displayed labels coincide", async () => {
  const schema = {
    type: "object",
    properties: {
      modes: {
        title: "模式",
        type: "array",
        uniqueItems: true,
        items: { type: "integer", enum: [0, 1], enumNames: ["中", "中"] },
      },
    },
  } as RJSFSchema;
  const change = vi.fn();
  const { container } = render(
    <LanguageProvider>
      <FormRenderer
        jsonSchema={schema}
        handleChange={change}
        uiSchema={{}}
        initialValues={{ modes: [1] }}
        formContext={{ isBuilderNode: true, showHandles: false }}
      />
    </LanguageProvider>,
  );
  const badge = container.querySelector(
    '[data-slot="multi-select-badge-label"]',
  );
  expect(badge?.textContent).toContain("中");
  fireEvent.focus(screen.getByRole("combobox"));
  const options = await screen.findAllByRole("option");
  expect(options).toHaveLength(2);
  expect(options[0].textContent).not.toBe(options[1].textContent);
  fireEvent.click(options[0]);
  await waitFor(() =>
    expect(change.mock.lastCall?.[0].formData).toEqual({ modes: [1, 0] }),
  );
});

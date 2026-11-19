import { expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { BlockUIType } from "@/app/(platform)/build/components/types";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render } from "@/tests/integrations/test-utils";
import Form from "../registry";
import { customValidator } from "../utils/custom-validator";

test("localizes schema type hints while keeping schema field names unchanged", () => {
  render(
    <LanguageProvider>
      <Form
        schema={{
          type: "object",
          properties: {
            message: { type: "string", title: "Raw field title" },
            count: { type: "integer", title: "Custom count" },
          },
        }}
        validator={customValidator}
        formContext={{
          nodeId: "localized-types",
          showHandles: false,
          uiType: BlockUIType.STANDARD,
        }}
      />
    </LanguageProvider>,
  );

  expect(screen.getByText("(文本)")).toBeDefined();
  expect(screen.getByText("(整数)")).toBeDefined();
  expect(screen.getByText("Raw field title")).toBeDefined();
  expect(screen.getByText("Custom count")).toBeDefined();
});

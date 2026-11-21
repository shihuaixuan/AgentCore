import { RJSFSchema } from "@rjsf/utils";

/**
 * Pre-processes the input schema to ensure all properties have a type defined.
 * If a property doesn't have a type, it assigns a union of all supported JSON Schema types.
 */

export function preprocessInputSchema(
  schema: RJSFSchema,
  preserveNestedLabels = false,
): RJSFSchema {
  return processSchema(schema, preserveNestedLabels, true);
}

function processSchema(
  schema: RJSFSchema,
  preserveNestedLabels: boolean,
  isRoot: boolean,
): RJSFSchema {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  const processedSchema = { ...schema };

  // Recursively process properties
  if (processedSchema.properties) {
    processedSchema.properties = { ...processedSchema.properties };

    for (const [key, property] of Object.entries(processedSchema.properties)) {
      if (property && typeof property === "object") {
        const processedProperty = { ...property };

        // Only add type if no type is defined AND no anyOf/oneOf/allOf is present
        if (
          !processedProperty.type &&
          !processedProperty.anyOf &&
          !processedProperty.oneOf &&
          !processedProperty.allOf &&
          !(preserveNestedLabels && processedProperty.$ref)
        ) {
          processedProperty.anyOf = [
            { type: "string" },
            { type: "number" },
            { type: "integer" },
            { type: "boolean" },
            { type: "array", items: { type: "string" } },
            {
              type: "object",
              ...(preserveNestedLabels ? {} : { title: "Object" }),
              additionalProperties: true,
            },
            { type: "null" },
          ];
        }

        // when encountering an array with items missing type
        if (processedProperty.type === "array" && processedProperty.items) {
          const items = processedProperty.items as RJSFSchema;
          if (
            !items.type &&
            !items.anyOf &&
            !items.oneOf &&
            !items.allOf &&
            !(preserveNestedLabels && (items.$ref || Array.isArray(items)))
          ) {
            processedProperty.items = {
              ...(preserveNestedLabels ? items : {}),
              type: "string",
              title: items.title ?? "",
            };
          }
        }

        // Recursively process nested objects
        if (
          processedProperty.type === "object" ||
          (Array.isArray(processedProperty.type) &&
            processedProperty.type.includes("object"))
        ) {
          processedProperty.properties = processProperties(
            processedProperty.properties,
            preserveNestedLabels,
          );
        }

        // Process array items
        if (
          processedProperty.type === "array" ||
          (Array.isArray(processedProperty.type) &&
            processedProperty.type.includes("array"))
        ) {
          if (processedProperty.items) {
            processedProperty.items = processItems(
              processedProperty.items,
              preserveNestedLabels,
            );
          }
        }

        processedSchema.properties[key] = processedProperty;
      }
    }
  }

  // Process array items at root level
  if (processedSchema.items) {
    processedSchema.items = processItems(
      processedSchema.items,
      preserveNestedLabels,
    );
  }

  if (isRoot || !preserveNestedLabels) {
    processedSchema.title = "";
    processedSchema.description = "";
  }

  return processedSchema;
}

/**
 * Helper function to process properties object
 */
function processItems(
  items: NonNullable<RJSFSchema["items"]>,
  preserveNestedLabels: boolean,
): RJSFSchema["items"] {
  if (preserveNestedLabels && Array.isArray(items)) {
    return items.map((item) => processSchema(item as RJSFSchema, true, false));
  }
  return processSchema(items as RJSFSchema, preserveNestedLabels, false);
}

function processProperties(
  properties: any,
  preserveNestedLabels: boolean,
): any {
  if (!properties || typeof properties !== "object") {
    return properties;
  }

  const processedProperties = { ...properties };

  for (const [key, property] of Object.entries(processedProperties)) {
    if (property && typeof property === "object") {
      processedProperties[key] = processSchema(
        property as RJSFSchema,
        preserveNestedLabels,
        false,
      );
    }
  }

  return processedProperties;
}

import {
  FieldProps,
  getFirstMatchingOption,
  mergeSchemas,
  type RJSFSchema,
} from "@rjsf/utils";
import { useRef, useState } from "react";
import { customValidator } from "../../utils/custom-validator";
import { getDefaultTypeIndex, stripEmptyProperties } from "./helpers";
import { cleanUpHandleId } from "../../helpers";
import { useEdgeStore } from "@/app/(platform)/build/stores/edgeStore";
import { getTypeDisplayInfo } from "@/app/(platform)/build/components/FlowEditor/nodes/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const useAnyOfField = (props: FieldProps) => {
  const { registry, schema, options, onChange, formData } = props;
  const { schemaUtils } = registry;
  const { locale, t } = useTranslation();

  const getInitialOption = () => {
    if (formData !== undefined && formData !== null) {
      const option = getFirstMatchingOption(
        customValidator,
        formData,
        stripEmptyProperties(options),
        schema,
      );
      return option !== undefined ? option : getDefaultTypeIndex(options);
    }
    return getDefaultTypeIndex(options);
  };

  const [selectedOption, setSelectedOption] =
    useState<number>(getInitialOption);
  const initialOptions = useRef<RJSFSchema[]>(options);
  const retrievedOptions: RJSFSchema[] = registry.formContext.isBuilderNode
    ? options
    : initialOptions.current;

  const option =
    selectedOption >= 0 ? retrievedOptions[selectedOption] || null : null;
  let optionSchema: any | undefined | null;

  // adding top level required to each option schema
  if (option) {
    const { required } = schema;
    optionSchema = required
      ? (mergeSchemas({ required }, option) as any)
      : option;
  }

  const field_id = props.fieldPathId.$id;

  const handleOptionChange = (option?: string) => {
    const intOption = option !== undefined ? parseInt(option, 10) : -1;
    if (intOption === selectedOption) return;

    const newOption = intOption >= 0 ? retrievedOptions[intOption] : undefined;
    const oldOption =
      selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;

    //   When we change the option, we need to clean the form data
    let newFormData = schemaUtils.sanitizeDataForNewSchema(
      newOption,
      oldOption,
      formData,
    );

    const handlePrefix = cleanUpHandleId(field_id);
    useEdgeStore
      .getState()
      .removeEdgesByHandlePrefix(registry.formContext.nodeId, handlePrefix);

    // We have cleaned the form data, now we need to get the default form state of new selected option
    if (newOption) {
      newFormData = schemaUtils.getDefaultFormState(
        newOption,
        newFormData,
        "excludeObjectChildren",
      ) as any;
    }

    setSelectedOption(intOption);
    onChange(newFormData, props.fieldPathId.path, undefined, field_id);
  };

  const enumOptions = retrievedOptions.map((option, index) => ({
    value: index,
    label: registry.formContext.isBuilderNode
      ? option.title ||
        (option.type &&
          (locale === "en"
            ? String(option.type)
            : getTypeDisplayInfo(option, locale).displayType)) ||
        t(`Option ${index + 1}`, `选项 ${index + 1}`)
      : String(option.type ?? ""),
  }));

  return {
    handleOptionChange,
    enumOptions,
    selectedOption,
    optionSchema,
    field_id,
  };
};

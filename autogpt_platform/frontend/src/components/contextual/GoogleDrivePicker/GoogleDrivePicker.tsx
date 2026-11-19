"use client";

import { Button } from "@/components/atoms/Button/Button";
import { CredentialsInput } from "@/components/contextual/CredentialsInput/CredentialsInput";
import {
  Props as BaseProps,
  useGoogleDrivePicker,
} from "./useGoogleDrivePicker";
import { FolderOpenIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export type Props = BaseProps;

export function GoogleDrivePicker(props: Props) {
  const { t } = useTranslation();
  const {
    credentials,
    hasGoogleOAuth,
    isAuthInProgress,
    isLoading,
    handleOpenPicker,
    selectedCredential,
    setSelectedCredential,
  } = useGoogleDrivePicker(props);

  if (!credentials || credentials.isLoading) {
    return <Icon icon={Loading03Icon} spin className="size-6" />;
  }

  if (!hasGoogleOAuth) {
    return (
      <CredentialsInput
        schema={credentials.schema}
        selectedCredentials={selectedCredential}
        onSelectCredentials={setSelectedCredential}
      />
    );
  }

  const hasMultipleCredentials =
    credentials.savedCredentials && credentials.savedCredentials.length > 1;

  return (
    <div className="flex flex-col gap-2">
      {hasMultipleCredentials && (
        <CredentialsInput
          schema={credentials.schema}
          selectedCredentials={selectedCredential}
          onSelectCredentials={setSelectedCredential}
        />
      )}
      <Button
        size="small"
        type="button"
        onClick={handleOpenPicker}
        disabled={props.disabled || isLoading || isAuthInProgress}
      >
        <Icon icon={FolderOpenIcon} className="size-4" />
        {props.buttonText ||
          t("Choose file(s) from Google Drive", "从 Google 云端硬盘选择文件")}
      </Button>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import type { DeletionSource } from "../../helpers";
import { emailMatches } from "./helpers";
import { useDeleteAccount } from "./useDeleteAccount";
import { useDeletionConsequences } from "./useDeletionConsequences";
import { identityUsername } from "@/lib/auth/local-username";

interface Args {
  source: DeletionSource;
  onBusyChange: (busy: boolean) => void;
}

export function useConfirmDeleteStep({ source, onBusyChange }: Args) {
  const [typedEmail, setTypedEmail] = useState("");
  const consequences = useDeletionConsequences();
  const { email, isDeleting, deleteAccount } = useDeleteAccount({
    source,
    onBusyChange,
  });
  const username = identityUsername(email);
  const canDelete =
    !isDeleting &&
    emailMatches({ typed: typedEmail, email: username ?? email });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canDelete) return;
    void deleteAccount(username ? email : typedEmail.trim());
  }

  return {
    email: username ?? email,
    username,
    typedEmail,
    setTypedEmail,
    consequences,
    canDelete,
    isDeleting,
    handleSubmit,
  };
}

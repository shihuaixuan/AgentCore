import { useEffect, useInsertionEffect, useRef } from "react";

/**
 * Lets a send wait until the chat's current turn has settled. Each waiter
 * learns whether it settled (send now) or the hook went away first (the
 * chat host unmounted), in which case the send is dropped.
 */
export function useSettleGate(
  isSettled: boolean,
  isRecipientTurnSettled = isSettled,
) {
  const settledRef = useRef({ isSettled, isRecipientTurnSettled });
  const isDispatchingRef = useRef(false);
  // Every commit, before the effects below resolve any waiter.
  useInsertionEffect(() => {
    settledRef.current = { isSettled, isRecipientTurnSettled };
  });
  const waitersRef = useRef<
    Array<{
      hasRecipient: boolean;
      resolve: (settled: boolean) => void;
    }>
  >([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (isDispatchingRef.current) return;
    for (const waiter of waitersRef.current.splice(0)) {
      if (waiter.hasRecipient ? isRecipientTurnSettled : isSettled)
        waiter.resolve(true);
      else waitersRef.current.push(waiter);
    }
  }, [isSettled, isRecipientTurnSettled]);
  useEffect(() => {
    isMountedRef.current = true;
    const waiters = waitersRef.current;
    return () => {
      isMountedRef.current = false;
      waiters.splice(0).forEach(({ resolve }) => resolve(false));
    };
  }, []);

  /** A send still uploading when the host unmounted asks only afterwards,
   *  when nothing is left to resolve it. */
  function canClaimTurn(hasRecipient: boolean) {
    const { isSettled, isRecipientTurnSettled } = settledRef.current;
    return (
      (hasRecipient ? isRecipientTurnSettled : isSettled) &&
      !isDispatchingRef.current
    );
  }

  function waitUntilSettled(hasRecipient = false) {
    if (!isMountedRef.current) return Promise.resolve(false);
    if (canClaimTurn(hasRecipient)) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      waitersRef.current.push({ hasRecipient, resolve });
    });
  }

  function claimTurn(hasRecipient = false) {
    if (!canClaimTurn(hasRecipient)) return false;
    isDispatchingRef.current = true;
    return true;
  }

  function releaseTurn() {
    isDispatchingRef.current = false;
    if (!isMountedRef.current) return;
    for (const waiter of waitersRef.current.splice(0)) {
      if (canClaimTurn(waiter.hasRecipient)) waiter.resolve(true);
      else waitersRef.current.push(waiter);
    }
  }

  return { waitUntilSettled, claimTurn, releaseTurn };
}

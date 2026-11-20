export function scheduleSilenceCheck(
  delay: number,
  wireTimeRemaining: (() => number) | undefined,
  onSilence: () => void,
) {
  let timer = setTimeout(check, delay);
  function check() {
    const remaining = wireTimeRemaining?.() ?? 0;
    if (remaining > 0) timer = setTimeout(check, remaining);
    else onSilence();
  }
  return () => clearTimeout(timer);
}

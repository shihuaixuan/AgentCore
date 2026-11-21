export function distinctOptionLabels<
  T extends { label: string; value: unknown },
>(options: T[]): T[] {
  const used = new Set(options.map(({ label }) => label));
  if (used.size === options.length) return options;
  const counts = new Map<string, number>();
  for (const { label } of options)
    counts.set(label, (counts.get(label) ?? 0) + 1);
  return options.map((option, index) => {
    if (counts.get(option.label) === 1) return option;
    let label = `${option.label} (${String(option.value)})`;
    while (used.has(label)) label += ` · ${index + 1}`;
    used.add(label);
    return { ...option, label };
  });
}

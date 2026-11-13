export function sumNullableCounts(...values: (number | null)[]) {
  if (values.some((value) => value === null)) return null;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

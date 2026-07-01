/** Distinct advocate colors by party index (0-1 match the 2-party teal/amber). */
export const PARTY_COLORS = [
  "#4FB0A6", // teal
  "#E0885A", // amber-coral
  "#7C7AE0", // violet
  "#5BA773", // green
  "#D46A92", // rose
];

export function partyColor(index: number): string {
  return PARTY_COLORS[index % PARTY_COLORS.length];
}

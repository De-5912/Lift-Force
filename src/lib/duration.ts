export const durationRanges = [
  { id: "week", name: "Up to 1 week", min: 1, max: 7 },
  { id: "weeks", name: "1–4 weeks", min: 8, max: 28 },
  { id: "months-1-3", name: "1–3 months", min: 29, max: 90 },
  { id: "months-3-6", name: "3–6 months", min: 91, max: 180 },
  { id: "months-6-12", name: "6–12 months", min: 181, max: 365 },
  { id: "year-plus", name: "More than 12 months", min: 366, max: Infinity },
] as const;

export function matchesDuration(
  job: { start_date: string; end_date: string },
  rangeId: string,
) {
  if (!rangeId) return true;
  const range = durationRanges.find((item) => item.id === rangeId);
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(timestamp) &&
      new Date(timestamp).toISOString().slice(0, 10) === value
      ? timestamp
      : NaN;
  };
  // Inclusive UTC calendar days: a same-day engagement lasts one day.
  const days = (parse(job.end_date) - parse(job.start_date)) / 86_400_000 + 1;
  return !!range && days >= range.min && days <= range.max;
}

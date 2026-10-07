export const platformLocations = [
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Delhi NCR", state: "Delhi" },
] as const;

export function locationOptions(
  records: ReadonlyArray<{ city: string; state: string }>,
  state = "",
) {
  const locations = [...platformLocations, ...records];
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort();
  return {
    states: unique(locations.map((location) => location.state)),
    cities: unique(
      locations
        .filter((location) => !state || location.state === state)
        .map((location) => location.city),
    ),
  };
}

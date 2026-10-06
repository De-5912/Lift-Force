import test from "node:test";
import assert from "node:assert/strict";
import {
  canAllocate,
  filterManpowerListings,
  jobSchema,
  manpowerListingSchema,
  submissionSchema,
} from "../src/lib/domain";
import { id, demoJobs, demoManpowerListings } from "../src/lib/demo";
test("Allocation rejects overfill and invalid quantities", () => {
  assert.equal(canAllocate(10, 6, 4), true);
  assert.equal(canAllocate(10, 6, 5), false);
  assert.equal(canAllocate(10, 6, -1), false);
  assert.equal(canAllocate(10, 6, 1.5), false);
});
test("Requirement validation rejects invalid dates, budgets and duplicate roles", () => {
  const j = {
    ...demoJobs[0],
    address: "",
    skills: [],
    lines: [{ role_id: id(202), quantity: 6, min_experience: 3 }],
    publish: true,
  };
  assert.equal(jobSchema.safeParse(j).success, true);
  assert.equal(
    jobSchema.safeParse({ ...j, end_date: "2020-01-01" }).success,
    false,
  );
  assert.equal(jobSchema.safeParse({ ...j, max_rate: 1 }).success, false);
  assert.equal(
    jobSchema.safeParse({ ...j, lines: [...j.lines, ...j.lines] }).success,
    false,
  );
  assert.equal(
    jobSchema.safeParse({ ...j, individuals: false, vendors: false }).success,
    false,
  );
});
test("Worker and vendor submissions have distinct required data", () => {
  const s = {
    job_id: id(1000),
    kind: "application",
    rate: 1500,
    rate_basis: "DAY",
    start_date: "2026-10-15",
    message: "Available for the project.",
    experience: "Seven years of experience.",
    mobilization_days: 0,
    terms: "",
    confirmed: true,
    items: [],
  };
  assert.equal(submissionSchema.safeParse(s).success, false);
  assert.equal(
    submissionSchema.safeParse({ ...s, job_role_id: id(2000) }).success,
    true,
  );
  assert.equal(
    submissionSchema.safeParse({ ...s, kind: "proposal" }).success,
    false,
  );
  assert.equal(
    submissionSchema.safeParse({
      ...s,
      kind: "proposal",
      items: [{ job_role_id: id(2000), quantity: 4 }],
    }).success,
    true,
  );
});
test("Manpower listing validation enforces roles, quantities, experience and rates", () => {
  const listing = {
    ...demoManpowerListings[0],
    items: demoManpowerListings[0].items.map((item) => ({
      worker_role_id: item.worker_role_id,
      quantity_available: item.quantity_available,
      minimum_experience_years: item.minimum_experience_years,
      maximum_experience_years: item.maximum_experience_years,
    })),
    categories: demoManpowerListings[0].categories.map((item) => item.id),
    skills: demoManpowerListings[0].skills.map((item) => item.id),
    publish: true,
  };
  assert.equal(manpowerListingSchema.safeParse(listing).success, true);
  assert.equal(
    manpowerListingSchema.safeParse({ ...listing, items: [] }).success,
    false,
  );
  assert.equal(
    manpowerListingSchema.safeParse({
      ...listing,
      items: [{ ...listing.items[0], quantity_available: 0 }],
    }).success,
    false,
  );
  assert.equal(
    manpowerListingSchema.safeParse({
      ...listing,
      items: [
        {
          ...listing.items[0],
          minimum_experience_years: 8,
          maximum_experience_years: 4,
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    manpowerListingSchema.safeParse({
      ...listing,
      rate_type: "DAY",
      minimum_rate: 2000,
      maximum_rate: 1000,
    }).success,
    false,
  );
  assert.equal(
    manpowerListingSchema.safeParse({
      ...listing,
      rate_type: "NEGOTIATED",
      minimum_rate: null,
      maximum_rate: null,
    }).success,
    true,
  );
});
test("Manpower marketplace filters roles, skills, capacity, availability and travel", () => {
  assert.equal(
    filterManpowerListings(demoManpowerListings, { city: "Bengaluru" }).length,
    1,
  );
  assert.equal(
    filterManpowerListings(demoManpowerListings, {
      role: id(203),
      skill: id(305),
    })[0]?.city,
    "Hyderabad",
  );
  assert.equal(
    filterManpowerListings(demoManpowerListings, {
      minimumQuantity: 15,
      willingToTravel: true,
    }).every((listing) => listing.willing_to_travel),
    true,
  );
  const sorted = filterManpowerListings(demoManpowerListings, {
    availableBy: "2026-10-15",
    sort: "availability",
  });
  assert.deepEqual(
    sorted.map((listing) => listing.available_from),
    ["2026-10-10", "2026-10-12", "2026-10-15"],
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { canAllocate, jobSchema, submissionSchema } from "../src/lib/domain";
import { id, demoJobs } from "../src/lib/demo";
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

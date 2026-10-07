import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Marketplace } from "../src/components/marketplace";
import { ManpowerMarketplace } from "../src/components/manpower-marketplace";
import {
  categories,
  roles,
  skills,
  demoJobs,
  demoManpowerListings,
} from "../src/lib/demo";
import type { Taxon } from "../src/lib/domain";

const taxonomy = { categories, roles, skills };

function assertOptions(html: string, label: string, catalogue: Taxon[]) {
  const select = html.match(
    new RegExp(`<label[^>]*><span>${label}</span><select[^>]*>(.*?)</select>`),
  );
  assert.ok(select, `Missing ${label} filter`);
  const options = [...select[1].matchAll(/<option[^>]*>.*?<\/option>/g)].map(
    (match) => match[0],
  );
  assert.equal(options.length, catalogue.length + 1, `${label} catalogue size`);
  assert.deepEqual(
    options.slice(1),
    catalogue.map((item) =>
      renderToStaticMarkup(
        createElement("option", { value: item.id }, item.name),
      ),
    ),
    `${label} must include every reference ID and label, in catalogue order`,
  );
}

test("requirements expose the full reference taxonomy with zero or sparse jobs", () => {
  for (const jobs of [[], demoJobs.slice(0, 1)]) {
    const html = renderToStaticMarkup(
      createElement(Marketplace, { jobs, taxonomy }),
    );
    assertOptions(html, "Worker role", roles);
    assertOptions(html, "Work category", categories);
    if (!jobs.length)
      assert.match(html, /No open requirements match your filters/);
  }
});

test("manpower exposes the full reference taxonomy with zero or sparse listings", () => {
  for (const listings of [[], demoManpowerListings.slice(0, 1)]) {
    const html = renderToStaticMarkup(
      createElement(ManpowerMarketplace, { listings, taxonomy }),
    );
    assertOptions(html, "Worker role", roles);
    assertOptions(html, "Work category", categories);
    assertOptions(html, "Skill", skills);
    if (!listings.length)
      assert.match(html, /No available manpower matches these filters/);
  }
});

import { platformLocations, locationOptions } from "../src/lib/locations";
import { durationRanges, matchesDuration } from "../src/lib/duration";
import { label, rateBases } from "../src/lib/domain";

function locationLabels(html: string, label: string) {
  const select = html.match(
    new RegExp(`<label[^>]*><span>${label}</span><select[^>]*>(.*?)</select>`),
  );
  assert.ok(select);
  return [...select[1].matchAll(/<option[^>]*>(.*?)<\/option>/g)]
    .slice(1)
    .map((match) => match[1]);
}

test("empty and populated marketplaces retain platform and live-record locations", () => {
  for (const live of [false, true]) {
    const extra = { city: "Jaipur", state: "Rajasthan" };
    const expected = locationOptions(live ? [extra] : []);
    const pages = [
      renderToStaticMarkup(
        createElement(Marketplace, {
          jobs: live ? [{ ...demoJobs[0], ...extra }] : [],
          taxonomy,
        }),
      ),
      renderToStaticMarkup(
        createElement(ManpowerMarketplace, {
          listings: live ? [{ ...demoManpowerListings[0], ...extra }] : [],
          taxonomy,
        }),
      ),
    ];
    for (const html of pages) {
      assert.deepEqual(locationLabels(html, "City"), expected.cities);
      assert.deepEqual(locationLabels(html, "State"), expected.states);
      for (const location of platformLocations) {
        assert.ok(expected.cities.includes(location.city));
        assert.ok(expected.states.includes(location.state));
      }
      if (live) {
        assert.ok(expected.cities.includes("Jaipur"));
        assert.ok(expected.states.includes("Rajasthan"));
      }
    }
  }
});

test("location options deduplicate records and restrict cities by state", () => {
  assert.deepEqual(
    locationOptions(
      [
        { city: "Mumbai", state: "Maharashtra" },
        { city: "Nagpur", state: "Maharashtra" },
      ],
      "Maharashtra",
    ).cities,
    ["Mumbai", "Nagpur", "Pune"],
  );
  assert.deepEqual(locationOptions([], "Delhi").cities, ["Delhi NCR"]);
  assert.ok(locationOptions([], "Delhi").states.includes("Karnataka"));
});

test("empty requirements offer every canonical rate basis and stable duration range", () => {
  const html = renderToStaticMarkup(
    createElement(Marketplace, { jobs: [], taxonomy }),
  );
  assertOptions(
    html,
    "Rate basis",
    rateBases.map((id) => ({ id, name: label(id) })),
  );
  assertOptions(
    html,
    "Duration",
    durationRanges.map(({ id, name }) => ({ id, name })),
  );
});

test("duration ranges use inclusive dates with non-overlapping boundaries, not display text", () => {
  for (const [index, range] of durationRanges.entries()) {
    for (const days of [
      range.min,
      Number.isFinite(range.max) ? range.max : 730,
    ]) {
      const end = new Date(Date.UTC(2026, 0, 1) + (days - 1) * 86400000)
        .toISOString()
        .slice(0, 10);
      const job = {
        ...demoJobs[0],
        start_date: "2026-01-01",
        end_date: end,
        duration: "unrelated text",
      };
      assert.deepEqual(
        durationRanges
          .filter((r) => matchesDuration(job, r.id))
          .map((r) => r.id),
        [durationRanges[index].id],
      );
    }
  }
  assert.ok(
    matchesDuration(
      { start_date: "2028-02-28", end_date: "2028-03-05" },
      "week",
    ),
  );
  for (const end_date of ["", "invalid", "2026-02-30", "2025-12-31"]) {
    for (const range of durationRanges)
      assert.equal(
        matchesDuration({ start_date: "2026-01-01", end_date }, range.id),
        false,
      );
  }
  assert.equal(matchesDuration({ start_date: "", end_date: "" }, ""), true);
  assert.equal(
    matchesDuration(
      { start_date: "2026-01-01", end_date: "2026-01-01" },
      "unknown",
    ),
    false,
  );
});

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

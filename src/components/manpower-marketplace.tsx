"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  filterManpowerListings,
  label,
  manpowerRateTypes,
  type ManpowerListing,
  type Taxon,
} from "@/lib/domain";
import { Empty, Field } from "./ui";
import { ManpowerCard } from "./manpower-card";

export function ManpowerMarketplace({
  listings,
  taxonomy,
}: {
  listings: ManpowerListing[];
  taxonomy: { roles: Taxon[]; categories: Taxon[]; skills: Taxon[] };
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [rateType, setRateType] = useState("");
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState<"newest" | "availability" | "capacity">(
    "newest",
  );
  const unique = (values: string[]) => [...new Set(values)].sort();
  const filtered = filterManpowerListings(listings, {
    keyword,
    city,
    state,
    role,
    category,
    skill,
    minimumQuantity: minimumQuantity ? Number(minimumQuantity) : undefined,
    availableBy,
    willingToTravel,
    rateType,
    verified,
    sort,
  });
  const clear = () => {
    setKeyword("");
    setCity("");
    setState("");
    setRole("");
    setCategory("");
    setSkill("");
    setMinimumQuantity("");
    setAvailableBy("");
    setWillingToTravel(false);
    setRateType("");
    setVerified(false);
  };
  return (
    <>
      <div className="search-bar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            className="search-input"
            aria-label="Search available manpower"
            placeholder="Search roles, skills, vendors or location…"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>
      <button
        className="button secondary mobile-filter-toggle"
        aria-expanded={filtersOpen}
        aria-controls="manpower-filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        {filtersOpen ? "Hide filters" : "Filter manpower"}
      </button>
      <div className="market-layout">
        <aside
          id="manpower-filters"
          className={`filter-panel ${filtersOpen ? "filters-open" : ""}`}
        >
          <h2>Filter manpower</h2>
          <div className="filter-fields">
            <Field label="City">
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="">All cities</option>
                {unique(listings.map((listing) => listing.city)).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="State">
              <select
                value={state}
                onChange={(event) => setState(event.target.value)}
              >
                <option value="">All states</option>
                {unique(listings.map((listing) => listing.state)).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Worker role">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="">Any role</option>
                {taxonomy.roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Work category">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Any category</option>
                {taxonomy.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Skill">
              <select
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
              >
                <option value="">Any skill</option>
                {taxonomy.skills.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum team size">
              <input
                type="number"
                min="1"
                value={minimumQuantity}
                onChange={(event) => setMinimumQuantity(event.target.value)}
                placeholder="Any size"
              />
            </Field>
            <Field label="Available by">
              <input
                type="date"
                value={availableBy}
                onChange={(event) => setAvailableBy(event.target.value)}
              />
            </Field>
            <Field label="Rate type">
              <select
                value={rateType}
                onChange={(event) => setRateType(event.target.value)}
              >
                <option value="">Any rate type</option>
                {manpowerRateTypes.map((value) => (
                  <option key={value} value={value}>
                    {value === "NEGOTIATED" ? "Negotiable" : label(value)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={willingToTravel}
              onChange={(event) => setWillingToTravel(event.target.checked)}
            />
            Willing to travel
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
            />
            Reviewed vendors only
          </label>
          <button className="text-button" onClick={clear}>
            Clear filters
          </button>
        </aside>
        <div>
          <div className="results-toolbar">
            <span>
              <strong>{filtered.length}</strong> active manpower listings
            </span>
            <label>
              Sort:{" "}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
              >
                <option value="newest">Newest first</option>
                <option value="availability">Earliest availability</option>
                <option value="capacity">Largest capacity</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="job-grid">
              {filtered.map((listing) => (
                <ManpowerCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Empty
              title="No available manpower matches these filters"
              body="Try a broader role, location or availability date, or clear your filters."
            />
          )}
        </div>
      </div>
    </>
  );
}

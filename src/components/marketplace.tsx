"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Job, Profile, Taxon } from "@/lib/domain";
import { JobCard } from "./job-card";
import { Empty, Field } from "./ui";
export function Marketplace({
  jobs,
  taxonomy,
  profile,
}: {
  jobs: Job[];
  taxonomy: { roles: Taxon[]; categories: Taxon[] };
  profile?: Profile;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState(""),
    [city, setCity] = useState(""),
    [state, setState] = useState(""),
    [maxBudget, setMaxBudget] = useState(""),
    [category, setCategory] = useState(""),
    [kind, setKind] = useState(""),
    [stay, setStay] = useState(false),
    [verified, setVerified] = useState(false),
    [food, setFood] = useState(false),
    [travel, setTravel] = useState(false),
    [sort, setSort] = useState("newest"),
    [role, setRole] = useState(""),
    [experience, setExperience] = useState(""),
    [budget, setBudget] = useState(""),
    [start, setStart] = useState(""),
    [duration, setDuration] = useState(""),
    [basis, setBasis] = useState("");
  const matchScore = (j: Job) =>
    (profile && j.city === profile.city ? 3 : 0) +
    (j.job_skills?.filter((s) =>
      profile?.skills?.some((p) => p.id === s.skills.id),
    ).length ?? 0);
  const filtered = jobs
    .filter(
      (j) =>
        `${j.title} ${j.description} ${j.city} ${j.state} ${j.categories.name} ${j.job_skills?.map((s) => s.skills.name).join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (!city || j.city === city) &&
        (!state || j.state === state) &&
        (!maxBudget || j.min_rate <= Number(maxBudget)) &&
        (!category || j.category_id === category) &&
        (!kind || (kind === "individual" ? j.individuals : j.vendors)) &&
        (!stay || j.accommodation === "YES") &&
        (!verified || j.profiles.verified) &&
        (!food || j.food === "YES") &&
        (!travel || j.travel === "YES") &&
        (!role || j.job_roles.some((r) => r.role_id === role)) &&
        (!experience ||
          j.job_roles.some((r) => r.min_experience <= Number(experience))) &&
        (!budget || j.max_rate >= Number(budget)) &&
        (!start || j.start_date >= start) &&
        (!duration || j.duration === duration) &&
        (!basis || j.rate_basis === basis),
    )
    .sort((a, b) =>
      sort === "match"
        ? matchScore(b) - matchScore(a)
        : sort === "highest"
          ? b.max_rate - a.max_rate
          : sort === "lowest"
            ? a.min_rate - b.min_rate
            : sort === "start"
              ? a.start_date.localeCompare(b.start_date)
              : sort === "oldest"
                ? a.created_at.localeCompare(b.created_at)
                : b.created_at.localeCompare(a.created_at),
    );
  const unique = (values: string[]) => [...new Set(values)].sort();
  return (
    <>
      <div className="search-bar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            className="search-input"
            aria-label="Search requirements"
            placeholder="Search by work, skill, city or state…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <button
        className="button secondary mobile-filter-toggle"
        aria-expanded={filtersOpen}
        aria-controls="requirement-filters"
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        {filtersOpen ? "Hide filters" : "Filter requirements"}
      </button>
      <div className="market-layout">
        <aside
          id="requirement-filters"
          className={`filter-panel ${filtersOpen ? "filters-open" : ""}`}
        >
          <h2>Filter requirements</h2>
          <div className="filter-fields">
            <Field label="City">
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All cities</option>
                {unique(jobs.map((j) => j.city)).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Work category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All work categories</option>
                {taxonomy.categories.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="State">
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">All states</option>
                {unique(jobs.map((j) => j.state)).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Worker role">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Any role</option>
                {taxonomy.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Applying as">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">Worker or vendor</option>
                <option value="individual">Individual worker</option>
                <option value="vendor">Manpower vendor</option>
              </select>
            </Field>
            <Field label="Your experience (years)">
              <input
                type="number"
                min="0"
                max="60"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Any experience"
              />
            </Field>
            <Field label="Minimum budget (₹)">
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Any budget"
              />
            </Field>
            <Field label="Starting on or after">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Maximum budget (₹)">
              <input
                type="number"
                min="0"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="No maximum"
              />
            </Field>
            <Field label="Duration">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="">Any duration</option>
                {unique(jobs.map((j) => j.duration)).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Rate basis">
              <select value={basis} onChange={(e) => setBasis(e.target.value)}>
                <option value="">Any basis</option>
                {unique(jobs.map((j) => j.rate_basis)).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          {[
            ["Accommodation provided", stay, setStay],
            ["Food provided", food, setFood],
            ["Travel provided", travel, setTravel],
            ["Reviewed companies only", verified, setVerified],
          ].map(([name, value, set]) => (
            <label key={name as string} className="check">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) =>
                  (set as (v: boolean) => void)(e.target.checked)
                }
              />
              {name as string}
            </label>
          ))}
          <button
            className="text-button"
            onClick={() => {
              setQ("");
              setCity("");
              setState("");
              setMaxBudget("");
              setCategory("");
              setKind("");
              setStay(false);
              setVerified(false);
              setFood(false);
              setTravel(false);
              setRole("");
              setExperience("");
              setBudget("");
              setStart("");
              setDuration("");
              setBasis("");
            }}
          >
            Clear filters
          </button>
        </aside>
        <div>
          <div className="results-toolbar">
            <span>
              <strong>{filtered.length}</strong> open requirements
            </span>
            <label>
              Sort:{" "}
              <select
                aria-label="Sort requirements"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="start">Start date</option>
                <option value="highest">Highest budget</option>
                <option value="lowest">Lowest budget</option>
                {profile && (
                  <option value="match">Closest skill/location match</option>
                )}
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="job-grid">
              {filtered.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          ) : (
            <Empty
              title="No open requirements match your filters"
              body="Try another city, a broader category, or clear your filters."
            />
          )}
        </div>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, MapPin, ArrowUpRight } from "lucide-react";
import { money, type Profile } from "@/lib/domain";
import { Badge, Verified, Empty, Field } from "./ui";
import { Avatar } from "./avatar";
export function Directory({ profiles }: { profiles: Profile[] }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState(""),
    [experience, setExperience] = useState("");
  const filtered = profiles.filter(
    (p) =>
      `${p.name} ${p.city} ${p.state} ${p.primary_role} ${p.bio} ${p.skills?.map((s) => s.name).join(" ")} ${p.supplied_roles?.map((r) => r.name).join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!city || p.city === city) &&
      (!experience || p.experience >= Number(experience)),
  );
  return (
    <>
      <div className="search-bar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search profiles"
            placeholder="Search by name, skill, specialization or location…"
          />
        </div>
      </div>
      <div className="form-grid">
        <Field label="Location">
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {[...new Set(profiles.map((p) => p.city))].sort().map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Minimum experience (years)">
          <input
            type="number"
            min="0"
            max="60"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Any experience"
          />
        </Field>
      </div>
      <p>{filtered.length} profiles</p>
      <div className="job-grid">
        {filtered.map((p) => (
          <article className="job-card profile-card" key={p.id}>
            <div className="company-row">
              <Avatar profile={p} />
              <div>
                <h3>{p.name}</h3>
                <small>{p.primary_role}</small>
                {p.verified && (
                  <div>
                    <Verified />
                  </div>
                )}
              </div>
            </div>
            <div className="meta-row">
              <MapPin size={15} />
              {p.city}, {p.state}
            </div>
            <p>{p.bio}</p>
            <div className="badges">
              <Badge>{p.experience} years’ experience</Badge>
              <Badge tone="green">
                {p.availability || "Ask about availability"}
              </Badge>
              {p.kind === "VENDOR" && (
                <Badge>{p.team_size ?? 0} team members</Badge>
              )}
            </div>
            <div className="card-footer">
              <div className="rate">
                {money(p.expected_rate)}
                <small>expected / day</small>
              </div>
              <Link href={`/profiles/${p.id}`}>
                View profile <ArrowUpRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="No profiles match your search"
          body="Try a different city or specialization."
        />
      )}
    </>
  );
}

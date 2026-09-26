import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  Users,
  CalendarDays,
  Home,
  ShieldCheck,
} from "lucide-react";
import type { Job } from "@/lib/domain";
import { money, date, label } from "@/lib/domain";
import { Badge, Verified } from "./ui";
import { Avatar } from "./avatar";
export function JobCard({ job }: { job: Job }) {
  const total = job.job_roles.reduce((a, b) => a + b.quantity, 0);
  return (
    <article className="job-card">
      <div className="company-row">
        <Avatar profile={job.profiles} />
        <div>
          <strong>{job.profiles.name}</strong>
          {job.profiles.verified && <Verified />}
        </div>
      </div>
      <h3>
        <Link href={`/requirements/${job.id}`}>{job.title}</Link>
      </h3>
      <div className="meta-row">
        <MapPin size={15} />
        {job.city}, {job.state}
      </div>
      <div className="meta-row">
        <Users size={15} />
        {total} people needed <span>·</span> {job.duration}
      </div>
      <div className="meta-row">
        <CalendarDays size={15} />
        Starts {date(job.start_date)}
      </div>
      <div className="badges">
        <Badge>{job.categories.name}</Badge>
        {job.accommodation === "YES" && (
          <Badge tone="green">
            <Home size={12} />
            Stay provided
          </Badge>
        )}
        {job.ppe === "YES" && (
          <Badge>
            <ShieldCheck size={12} />
            PPE
          </Badge>
        )}
      </div>
      <div className="card-footer">
        <div className="rate">
          {money(job.min_rate)}–{money(job.max_rate)}
          <small>
            {job.rate_basis === "NEGOTIATED"
              ? "Negotiable"
              : job.rate_basis === "PROJECT"
                ? "fixed project budget"
                : `per person / ${label(job.rate_basis).toLowerCase()}`}
          </small>
        </div>
        <Link href={`/requirements/${job.id}`}>
          View work <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

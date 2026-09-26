import Link from "next/link";
import { ArrowUpRight, ShieldCheck, MapPin, MoveVertical } from "lucide-react";
import { getJobs } from "@/lib/data";
import { JobCard } from "@/components/job-card";
export default async function Home() {
  const jobs = await getJobs();
  return (
    <>
      <section className="container hero">
        <div>
          <p className="eyebrow">THE ELEVATOR WORKFORCE NETWORK</p>
          <h1>
            Great projects need
            <br />
            <em>the right people.</em>
          </h1>
          <p>
            Connect elevator projects with skilled technicians and trusted
            manpower partners. From installation to commissioning, build your
            team here.
          </p>
          <div className="actions">
            <Link href="/requirements" className="button">
              Find elevator work <ArrowUpRight size={17} />
            </Link>
            <Link href="/register?role=COMPANY" className="button secondary">
              Post a requirement
            </Link>
          </div>
          <div className="hero-note">
            <ShieldCheck size={17} />
            Purpose-built for project work. Across India.
          </div>
        </div>
        <div className="hero-board">
          <div className="board-top">
            <span>ONE PROJECT. A COMPLETE TEAM.</span>
            <MoveVertical size={20} />
          </div>
          <h2>
            Installation manpower
            <br />
            Residential tower project
          </h2>
          <p className="meta-row">
            <MapPin size={15} />
            Whitefield, Bengaluru · 3 months
          </p>
          <div className="board-lines">
            <div className="board-line">
              <strong>06</strong>
              <span>Installation technicians</span>
            </div>
            <div className="board-line">
              <strong>08</strong>
              <span>Skilled helpers</span>
            </div>
            <div className="board-line">
              <strong>01</strong>
              <span>Site supervisor</span>
            </div>
          </div>
          <div className="board-bottom">
            <span>
              A team, or an individual.
              <br />
              <small>There’s a place for both.</small>
            </span>
            <Link href="/how-it-works">How it works ↗</Link>
          </div>
        </div>
      </section>
      <div className="industry-strip">
        <strong>Built for every stage</strong>
        <span>Installation & erection</span>
        <span>Maintenance & repair</span>
        <span>Testing & commissioning</span>
        <span>Modernization</span>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NEXT PROJECT STARTS HERE</p>
            <h2>Open manpower requirements</h2>
            <p>Real project needs. Clear scope. The details that matter.</p>
          </div>
          <Link href="/requirements">Browse all requirements ↗</Link>
        </div>
        <div className="job-grid">
          {jobs.slice(0, 3).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        <div className="cta-grid">
          <article className="cta">
            <p className="eyebrow">FOR COMPANIES</p>
            <h2>Build your next site team.</h2>
            <p>
              Post the roles you need, compare individual applications and
              vendor quotations, and manage deployment in one place.
            </p>
            <Link href="/register?role=COMPANY" className="button">
              Post a requirement <ArrowUpRight size={16} />
            </Link>
          </article>
          <article className="cta alt">
            <p className="eyebrow">FOR WORKERS & CONTRACTORS</p>
            <h2>Your expertise. New opportunities.</h2>
            <p>
              Find projects that match your skills and availability. Apply as a
              technician or offer a complete manpower team.
            </p>
            <div className="actions">
              <Link href="/register?role=WORKER" className="button secondary">
                Join as a worker
              </Link>
              <Link href="/register?role=VENDOR" className="text-button">
                Register as a vendor ↗
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

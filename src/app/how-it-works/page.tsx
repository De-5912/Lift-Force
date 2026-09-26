import Link from "next/link";
import { PageTitle } from "@/components/ui";
export default function How() {
  return (
    <div className="container section">
      <PageTitle
        eyebrow="FROM REQUIREMENT TO DEPLOYMENT"
        title="Project staffing, step by step"
        description="One workspace for elevator companies, individual professionals and manpower partners."
      />
      <div className="steps">
        <article className="step">
          <h2>Define the project</h2>
          <p>
            Companies post the site location, work scope, schedule and multiple
            manpower roles. Rates and facilities are visible before anyone
            applies.
          </p>
        </article>
        <article className="step">
          <h2>Find the right fit</h2>
          <p>
            Workers apply for one role. Vendors propose a team, including
            partial fulfilment. Companies compare experience, rates and
            availability.
          </p>
        </article>
        <article className="step">
          <h2>Deploy with clarity</h2>
          <p>
            Discuss the details, select your team and confirm deployment. Track
            fulfilment and review one another after the engagement is complete.
          </p>
        </article>
      </div>
      <div className="cta-grid">
        <div className="cta">
          <h2>Need people for a project?</h2>
          <Link href="/register?role=COMPANY" className="button">
            Create a company account
          </Link>
        </div>
        <div className="cta">
          <h2>Ready for your next site?</h2>
          <Link href="/requirements" className="button">
            Browse requirements
          </Link>
        </div>
      </div>
    </div>
  );
}

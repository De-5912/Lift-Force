import Link from "next/link";
import { PageTitle } from "@/components/ui";
export default function Contact() {
  return (
    <div className="container section prose">
      <PageTitle
        title="Contact & support"
        description="Choose the right place for your question."
      />
      <div className="panel">
        <h2>Questions about a project</h2>
        <p>
          Use your project conversation to discuss scope, rates, availability or
          deployment with the company or applicant.
        </p>
        <Link className="button" href="/dashboard/messages">
          Open messages
        </Link>
      </div>
      <div className="panel">
        <h2>Report a safety or account concern</h2>
        <p>
          Sign in, open the relevant requirement or profile, and choose “Report
          a concern” or “Report this profile”. Platform administrators receive
          the report for review.
        </p>
        <Link className="button secondary" href="/requirements">
          Find the requirement
        </Link>
      </div>
      <div className="notice">
        This is a local development installation. A platform support email has
        not yet been configured.
      </div>
    </div>
  );
}

import { PageTitle } from "@/components/ui";
export default function About() {
  return (
    <div className="container section prose">
      <PageTitle
        eyebrow="ABOUT LIFTWORK"
        title="A workforce network built around project work"
      />
      <div className="panel">
        <p>
          Elevator companies often find temporary manpower through phone calls,
          personal contacts and scattered messages. Liftwork brings the
          requirement, the proposal and the deployment into one shared process.
        </p>
        <p>
          Companies can request different roles for the same site. Individual
          professionals apply for work they can perform. Manpower vendors
          propose the people they can supply, with their own rates and
          mobilization terms.
        </p>
        <p>
          The initial marketplace focuses on elevator installation, maintenance,
          modernization, testing and commissioning in India. Project staffing is
          the core of the platform.
        </p>
        <h2>What profile review means</h2>
        <p>
          Administrators can manually review business documents. A reviewed
          profile badge records this platform review; it does not represent
          government certification or a guarantee of performance.
        </p>
      </div>
    </div>
  );
}

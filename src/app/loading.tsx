export default function Loading() {
  return (
    <div className="container section" aria-label="Loading" aria-busy="true">
      <div className="skeleton title-skeleton" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton card-skeleton" />
      ))}
      <p>Loading your workspace…</p>
    </div>
  );
}

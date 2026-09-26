"use client";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container section empty">
      <h1>We couldn’t load this page</h1>
      <p>{error.message}</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

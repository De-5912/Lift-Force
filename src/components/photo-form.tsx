"use client";
import { useState, useTransition } from "react";
import { uploadPhoto, type ActionResult } from "@/app/actions";
import { Feedback } from "./action-form";
export function PhotoForm() {
  const [result, setResult] = useState<ActionResult>({}),
    [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => setResult(await uploadPhoto(data)));
      }}
    >
      <label className="field">
        <span>Public profile photo or company logo (PNG/JPEG, up to 2 MB)</span>
        <input name="file" type="file" accept="image/png,image/jpeg" required />
      </label>
      <button className="button secondary" disabled={pending}>
        {pending ? "Uploading…" : "Upload photo / logo"}
      </button>
      <Feedback result={result} />
      <hr style={{ margin: "24px 0", borderColor: "var(--line)" }} />
    </form>
  );
}

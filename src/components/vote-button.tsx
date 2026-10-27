"use client";

import { useState } from "react";

export function VoteButton({ categoryId, projectId }: { categoryId: string; projectId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  async function submit() {
    setState("saving");
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId, projectId }),
      });
      if (!response.ok) throw new Error("Vote rejected");
      setState("done");
    } catch {
      setState("error");
    }
  }
  return <div><button className="button button-primary" type="button" disabled={state === "saving" || state === "done"} onClick={submit}>{state === "saving" ? "Saving…" : state === "done" ? "Vote recorded" : "Vote for this project"}</button>{state === "error" && <p role="alert" style={{ color: "#a22", margin: "8px 0 0" }}>Your vote could not be recorded. Please try again.</p>}</div>;
}

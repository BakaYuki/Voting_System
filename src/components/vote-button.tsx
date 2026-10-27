"use client";

import { useState } from "react";

export function VoteButton({ categoryId, projectId, onVoteRecorded, onVoteUndone, initialVoted = false, disabled = false }: { categoryId: string; projectId: string; onVoteRecorded?: (remainingVotes: number) => void; onVoteUndone?: (projectId: string) => void; initialVoted?: boolean; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(initialVoted ? "done" : "idle");
  const [errorMessage, setErrorMessage] = useState("");
  async function submit() {
    setState("saving"); setErrorMessage("");
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId, projectId }),
      });
      const data = (await response.json()) as { error?: string; remaining_votes?: number };
      if (!response.ok) throw new Error(data.error ?? "Your vote could not be recorded.");
      if (typeof data.remaining_votes === "number") onVoteRecorded?.(data.remaining_votes);
      setState("done");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your vote could not be recorded.");
      setState("error");
    }
  }
  async function undo() {
    setState("saving"); setErrorMessage("");
    try {
      const response = await fetch("/api/votes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId, projectId }),
      });
      const data = (await response.json()) as { error?: string; remaining_votes?: number };
      if (!response.ok) throw new Error(data.error ?? "Your vote could not be undone.");
      if (typeof data.remaining_votes === "number") onVoteRecorded?.(data.remaining_votes);
      onVoteUndone?.(projectId);
      setState("idle");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your vote could not be undone.");
      setState("done");
    }
  }
  return <div><button className="button button-primary" type="button" disabled={state === "saving" || (disabled && state !== "done")} onClick={state === "done" ? undo : submit}>{state === "saving" ? "Saving…" : state === "done" ? "Undo vote" : disabled ? "No votes remaining" : "Vote for this project"}</button>{state === "error" && <p role="alert" style={{ color: "#a22", margin: "8px 0 0" }}>{errorMessage}</p>}</div>;
}

"use client";

import { useState } from "react";
import { VoteButton } from "@/components/vote-button";

type Project = { id: string; name: string; description: string; image_url: string | null };

export function CategoryVoting({ categoryId, projects }: { categoryId: string; projects: Project[] }) {
  const [remainingVotes, setRemainingVotes] = useState(3);

  return <>
    <div className="status-card" style={{ margin: "24px 0" }}>
      <strong>{remainingVotes} {remainingVotes === 1 ? "vote" : "votes"} remaining</strong>
      <span>Choose different projects. You can vote once per project.</span>
    </div>
    <div className="category-grid">{projects.map((project) => <article className="category-card" key={project.id}>
      {project.image_url && <img src={project.image_url} alt="" />}
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <div style={{ marginTop: 22 }}>
        <VoteButton categoryId={categoryId} projectId={project.id} onVoteRecorded={setRemainingVotes} disabled={remainingVotes === 0} />
      </div>
    </article>)}</div>
  </>;
}

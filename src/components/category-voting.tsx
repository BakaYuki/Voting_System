"use client";

import { useEffect, useState } from "react";
import { VoteButton } from "@/components/vote-button";

type Project = { id: string; name: string; description: string; image_url: string | null };

export function CategoryVoting({ categoryId, projects }: { categoryId: string; projects: Project[] }) {
  const [remainingVotes, setRemainingVotes] = useState(3);
  const [votedProjects, setVotedProjects] = useState<string[]>([]);
  const [checkingVotes, setCheckingVotes] = useState(true);

  useEffect(() => {
    fetch("/api/voter/session")
      .then((response) => response.json())
      .then((data: { remainingVotes?: Record<string, number>; votedProjects?: Record<string, string[]> }) => {
        setRemainingVotes(data.remainingVotes?.[categoryId] ?? 3);
        setVotedProjects(data.votedProjects?.[categoryId] ?? []);
      })
      .catch(() => undefined)
      .finally(() => setCheckingVotes(false));
  }, [categoryId]);

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
        <VoteButton key={`${project.id}-${votedProjects.includes(project.id)}`} categoryId={categoryId} projectId={project.id} onVoteRecorded={setRemainingVotes} onVoteUndone={(projectId) => setVotedProjects((current) => current.filter((id) => id !== projectId))} initialVoted={votedProjects.includes(project.id)} disabled={checkingVotes || remainingVotes === 0} />
      </div>
    </article>)}</div>
  </>;
}

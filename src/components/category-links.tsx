"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; description: string };

export function CategoryLinks({ categories, projectCounts, className = "category-grid" }: { categories: Category[]; projectCounts: Record<string, number>; className?: string }) {
  const [remainingVotes, setRemainingVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/voter/session")
      .then((response) => response.json())
      .then((data: { remainingVotes?: Record<string, number> }) => setRemainingVotes(data.remainingVotes ?? {}))
      .catch(() => setRemainingVotes({}));
  }, []);

  return <div className={className}>{categories.map((category) => <Link className="category-card" href={`/categories/${category.id}`} key={category.id}>
    <h2>{category.name}</h2>
    <p>{category.description}</p>
    <span>{projectCounts[category.id] ?? 0} projects · {remainingVotes[category.id] ?? 3} votes available →</span>
  </Link>)}</div>;
}

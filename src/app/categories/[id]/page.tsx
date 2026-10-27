import Link from "next/link";
import { VoteButton } from "@/components/vote-button";

export const instant = false;

const projects = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Neighbourhood Tool Library", description: "A shared place to borrow tools, learn practical skills, and help neighbours." },
  { id: "00000000-0000-0000-0000-000000000002", name: "Welcoming Streets", description: "Small improvements that make walking and meeting friends safer and easier." },
  { id: "00000000-0000-0000-0000-000000000003", name: "Community Skills Exchange", description: "A regular event where residents share knowledge, time, and encouragement." },
];
const categoryIds: Record<string, string> = { community: "00000000-0000-0000-0000-000000000010", innovation: "00000000-0000-0000-0000-000000000011", sustainability: "00000000-0000-0000-0000-000000000012" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = id.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <main className="shell section"><Link className="text-link" href="/categories">← All categories</Link><p className="eyebrow" style={{ marginTop: 32 }}>Category</p><h1>{title}</h1><div className="status-card" style={{ margin: "24px 0" }}><strong>3 votes remaining</strong><span>Choose carefully. You can use all three votes on the same project.</span></div><div className="category-grid">{projects.map((project) => <article className="category-card" key={project.name}><h2>{project.name}</h2><p>{project.description}</p><div style={{ marginTop: 22 }}><VoteButton categoryId={categoryIds[id] ?? categoryIds.community} projectId={project.id} /></div></article>)}</div></main>;
}

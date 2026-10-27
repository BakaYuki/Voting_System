import Link from "next/link";

const projects = [
  { name: "Neighbourhood Tool Library", description: "A shared place to borrow tools, learn practical skills, and help neighbours.", votes: 0 },
  { name: "Welcoming Streets", description: "Small improvements that make walking and meeting friends safer and easier.", votes: 0 },
  { name: "Community Skills Exchange", description: "A regular event where residents share knowledge, time, and encouragement.", votes: 0 },
];

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = id.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <main className="shell section"><Link className="text-link" href="/categories">← All categories</Link><p className="eyebrow" style={{ marginTop: 32 }}>Category</p><h1>{title}</h1><div className="status-card" style={{ margin: "24px 0" }}><strong>3 votes remaining</strong><span>Choose carefully. You can use all three votes on the same project.</span></div><div className="category-grid">{projects.map((project) => <article className="category-card" key={project.name}><h2>{project.name}</h2><p>{project.description}</p><button className="button button-primary" style={{ marginTop: 22 }}>Vote for this project</button></article>)}</div></main>;
}

const categories = [
  { name: "Community", projects: [["Neighbourhood Tool Library", 42, "4.2"], ["Welcoming Streets", 31, "3.1"], ["Community Skills Exchange", 27, "2.7"]] },
  { name: "Innovation", projects: [["Open Learning Hub", 58, "5.8"], ["Local Makers Network", 42, "4.2"]] },
];

export default function ResultsPage() {
  return <main className="shell section"><p className="eyebrow">Live results</p><h1>Project rankings</h1><p className="lede">Scores are calculated within each category. A score of 10 means a project received every valid vote in its category.</p><div style={{ display: "grid", gap: 34, marginTop: 40 }}>{categories.map((category) => <section key={category.name}><h2>{category.name}</h2><div style={{ display: "grid", gap: 10, marginTop: 16 }}>{category.projects.map(([name, votes, score], index) => <div className="step" key={name}><span className="step-number">{index + 1}</span><div style={{ flex: 1 }}><h3>{name}{index === 0 && <span style={{ color: "var(--brand)", fontSize: ".8em", marginLeft: 12 }}>Highest score</span>}</h3><p>{votes} votes</p></div><strong>{score} / 10</strong></div>)}</div></section>)}</div></main>;
}

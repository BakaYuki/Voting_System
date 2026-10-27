import Link from "next/link";

export const instant = false;

const categories = [
  {
    id: "community",
    name: "Community",
    description: "Projects that make our community stronger.",
    count: 8,
  },
  {
    id: "innovation",
    name: "Innovation",
    description: "Fresh ideas and practical solutions.",
    count: 6,
  },
  {
    id: "sustainability",
    name: "Sustainability",
    description: "Ideas that help protect our shared future.",
    count: 5,
  },
];

export default function Home() {
  return (
    <main className="shell section">
      <p className="eyebrow">Project awards</p>
      <h1>Choose a category</h1>
      <p className="lede">
        Select a category to see its projects and cast your votes.
      </p>
      <div className="category-grid category-grid-home">
        {categories.map((category) => (
          <Link
            className="category-card category-card-large"
            href={`/categories/${category.id}`}
            key={category.id}
          >
            <h2>{category.name}</h2>
            <p>{category.description}</p>
            <span>{category.count} projects · 3 votes available →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

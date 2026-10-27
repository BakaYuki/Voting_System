import Link from "next/link";

const categories = [
  { id: "community", name: "Community", description: "Projects that make our community stronger.", count: 8 },
  { id: "innovation", name: "Innovation", description: "Fresh ideas and practical solutions.", count: 6 },
  { id: "sustainability", name: "Sustainability", description: "Ideas that help protect our shared future.", count: 5 },
];

export default function CategoriesPage() {
  return <main className="shell section"><p className="eyebrow">Cast your votes</p><h1>Choose a category</h1><p className="lede">You have three votes in each category. Use all three on one project or spread them across different projects.</p><div className="category-grid">{categories.map((category) => <Link className="category-card" href={`/categories/${category.id}`} key={category.id}><h2>{category.name}</h2><p>{category.description}</p><span>{category.count} projects · 3 votes available →</span></Link>)}</div></main>;
}

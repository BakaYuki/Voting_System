import Link from "next/link";

const categories = [
  { name: "Community", description: "Projects that make our community stronger." },
  { name: "Innovation", description: "Fresh ideas and practical solutions." },
  { name: "Sustainability", description: "Ideas that help protect our shared future." },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <p className="eyebrow">Community project awards</p>
            <h1>Your voice helps choose the projects that matter most.</h1>
            <p className="lede">
              Explore this year&apos;s projects and cast up to three votes in each
              category. No account or personal details are required.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/categories">Start voting</Link>
              <Link className="button button-secondary" href="/results">View results</Link>
            </div>
          </div>
          <aside className="status-card" aria-label="Voting status">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>Voting is open</strong>
              <p>You can vote for up to three projects in every category.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>Simple, fair, and easy to use</h2>
          </div>
          <p className="muted">Your votes are saved immediately and results stay available after voting closes.</p>
        </div>
        <div className="steps">
          {["Choose a category", "Select your projects", "Submit your votes"].map((step, index) => (
            <div className="step" key={step}>
              <span className="step-number">{index + 1}</span>
              <div><h3>{step}</h3><p>{["Browse the projects competing in each award category.", "You have three votes per category and may use them any way you choose.", "Confirm your choices. You can return later while voting remains open."][index]}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <div><p className="eyebrow">Categories</p><h2>Vote in every category</h2></div>
          <Link className="text-link" href="/categories">See all categories →</Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => <Link className="category-card" href="/categories" key={category.name}><h3>{category.name}</h3><p>{category.description}</p><span>Explore projects →</span></Link>)}
        </div>
      </section>
    </main>
  );
}

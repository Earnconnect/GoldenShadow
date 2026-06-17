const steps = [
  {
    num: "1",
    title: "Build your IP profile",
    body: "Apply to join the platform. We review your IP, audience, and goals — then onboard you with a private IP audit and signature concept session to map your book and product roadmap.",
  },
  {
    num: "2",
    title: "Produce your flagship assets",
    body: "Work directly with your Golden Shadow editorial team to create your book, playbooks, and merch. AI workflows run quietly in the background — faster turnarounds, same human quality.",
  },
  {
    num: "3",
    title: "Publish, sell & compound",
    body: "Your book and products go live on GSP's marketplace and distributed channels. Get featured in the creator directory, attract brand and publisher partnerships, and earn across multiple revenue streams.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="how-head">
        <p className="eyebrow">How It Works</p>
        <h2>All the tools you need to turn IP into legacy — and revenue.</h2>
      </div>
      <div className="how-grid">
        {steps.map((step) => (
          <div className="how-card" key={step.num}>
            <div className="how-num">{step.num}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

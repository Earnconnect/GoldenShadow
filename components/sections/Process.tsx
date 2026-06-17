const steps = [
  {
    num: "01",
    title: "Immerse",
    body: "We read, listen, and watch everything you've built. Long-form interviews map your story, audience, and purpose — so nothing gets lost in translation.",
  },
  {
    num: "02",
    title: "Architect",
    body: "Your raw IP becomes a clear book and product blueprint — positioning, structure, and outcomes sharpened together.",
    ai: "Internal AI tools quietly synthesize transcripts. Our editors make every final decision.",
  },
  {
    num: "03",
    title: "Craft",
    body: "Your book is drafted and refined through close collaboration. Multiple rounds, real-time edits, your voice preserved throughout.",
    ai: "AI assists with consistency so your human team can focus on voice and narrative.",
  },
  {
    num: "04",
    title: "Produce",
    body: "Design, typesetting, metadata, and format conversions for print and digital to industry standards. Polished from first glance to last page.",
  },
  {
    num: "05",
    title: "Launch & Steward",
    body: "We guide launch strategy and ongoing IP use — bulk sales, speaking, content, and future editions. We don't close our books on launch day.",
  },
];

export default function Process() {
  return (
    <section id="process">
      <div className="process-head">
        <p className="eyebrow">Our Studio Process</p>
        <h2>Five stages, one human-led throughline</h2>
      </div>
      <div className="process-steps">
        {steps.map((step) => (
          <div className="pstep" key={step.num}>
            <div className="pn">{step.num}</div>
            <div className="pbody">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.ai && <p className="ai">{step.ai}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="infra">
        <h4>Our Invisible Infrastructure</h4>
        <p>
          Private, governed AI workflows handle repetitive tasks — transcript
          summarization, formatting, metadata — so you get faster turnarounds
          and more time with your human team, without sacrificing quality or
          creative control.
        </p>
      </div>
    </section>
  );
}

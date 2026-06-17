const testimonials = [
  {
    quote:
      "Golden Shadow feels more like a thought partner than a publishing service. My editor asked the questions I hadn't asked myself — and the book that came out of it changed how we show up to the market.",
    cite: "Founder, Cybersecurity Startup",
  },
  {
    quote:
      "I've worked with ghostwriters before. Golden Shadow was the first partner who treated the book like a core business asset, not a vanity project. The outline we built became the DNA of our brand playbook.",
    cite: "Executive, Industrial Tech Company",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials">
      <p className="eyebrow">What Our Clients Say</p>
      <div className="testi-grid">
        {testimonials.map((t) => (
          <div className="testi" key={t.cite}>
            <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
            <cite>{t.cite}</cite>
          </div>
        ))}
      </div>
      <p className="trust">
        Experience across: Technology · Finance · Media · Social Impact · Sports
        · Culture
      </p>
    </section>
  );
}

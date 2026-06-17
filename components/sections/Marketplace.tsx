const sides = [
  {
    eyebrow: "For Creators",
    title: "Turn your audience into a legacy",
    body: "Whether you have a podcast, a YouTube channel, a course, or a social following — GSP helps you distil your best ideas into books and products that earn long after the post is gone.",
    list: [
      "Apply with your existing body of work",
      "Get matched with an editorial team that fits your voice",
      "Produce your flagship book in 60–120 days",
      "List on the GSP marketplace and earn through the platform",
      "Unlock brand and publisher partnership opportunities",
    ],
  },
  {
    eyebrow: "For Executives",
    title: "Make your expertise the asset it deserves to be",
    body: "You've built something real — a methodology, a company, a body of knowledge. Golden Shadow takes that IP and turns it into a book, a product suite, and a platform that works for you beyond the boardroom.",
    list: [
      "IP audit maps your existing expertise and frameworks",
      "Book becomes your business card, sales tool, and legacy",
      "Playbooks and merch extend your IP into tangible products",
      "Ghostwriting and editorial team keeps your voice intact",
      "Featured prominently across the GSP platform and directory",
    ],
  },
];

export default function Marketplace() {
  return (
    <section id="marketplace">
      <div className="mp-grid">
        {sides.map((side) => (
          <div className="mp-side" key={side.eyebrow}>
            <p className="eyebrow">{side.eyebrow}</p>
            <h3>{side.title}</h3>
            <p>{side.body}</p>
            <ul className="mp-list">
              {side.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

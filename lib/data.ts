// ─────────────────────────────────────────────────────────────
// Central content source for Golden Shadow Publishing.
// The landing page, creator directory, category pages, and journal
// all read from here so content stays consistent across the app.
// ─────────────────────────────────────────────────────────────

export type Category = {
  slug: string;
  icon: string;
  name: string;
};

export type CreatorProject = {
  title: string;
  type: string;
  status: string;
};

export type Creator = {
  slug: string;
  initial: string;
  tag: string;
  categorySlug: string;
  name: string;
  role: string;
  desc: string;
  badge: string;
  focus: string[];
  bio: string[];
  projects: CreatorProject[];
  featured?: boolean;
  avatarUrl?: string;
};

export type CheckoutConfig = {
  mode: "payment" | "subscription";
  unitAmount: number; // in cents
  interval?: "month" | "year";
  productName: string;
};

export type PricingTier = {
  slug: string;
  tier: string;
  amount: string;
  amountSuffix?: string;
  per: string;
  desc: string;
  features: string[];
  cta: string;
  featured?: boolean;
  // If present, the CTA starts a Stripe Checkout session.
  // If absent, the CTA routes to the application form (/apply).
  checkout?: CheckoutConfig;
};

export type JournalPost = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  body: string[];
  coverUrl?: string;
};

export type BrowseTile = {
  label: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
};

export const marqueeItems: { lead: string; tail: string }[] = [
  { lead: "Books", tail: "Built with Intention" },
  { lead: "IP Productization", tail: "Playbooks & Merch" },
  { lead: "Hybrid Publishing", tail: "You Keep Your IP" },
  { lead: "AI-Assisted", tail: "Human-Led" },
  { lead: "Creators & Executives", tail: "Featured Daily" },
  { lead: "Thought Leadership", tail: "That Compounds" },
];

export const browseTiles: BrowseTile[] = [
  {
    label: "Browse by",
    title: "Creator",
    desc: "Insider access to your favorite thought leaders and their most powerful IP and books.",
    cta: "Browse All Creators →",
    href: "/creators",
  },
  {
    label: "Browse by",
    title: "Category",
    desc: "Explore IP and books across business, culture, wellness, finance, and more.",
    cta: "Browse All Categories →",
    href: "/categories",
  },
  {
    label: "Browse by",
    title: "Service",
    desc: "From IP audits to full flagship books — find the right offering for where you are.",
    cta: "See All Services →",
    href: "/#pricing",
  },
  {
    label: "Browse by",
    title: "Partnership",
    desc: "Brands, publishers, and institutions partner with our creators for authentic IP collaborations.",
    cta: "Explore Partnerships →",
    href: "/apply",
  },
];

export const categories: Category[] = [
  { slug: "business-strategy", icon: "💼", name: "Business & Strategy" },
  { slug: "finance-wealth", icon: "💰", name: "Finance & Wealth" },
  { slug: "culture-society", icon: "🌍", name: "Culture & Society" },
  { slug: "leadership-mindset", icon: "🧠", name: "Leadership & Mindset" },
  { slug: "media-podcasting", icon: "🎙️", name: "Media & Podcasting" },
  { slug: "wellness-lifestyle", icon: "🌱", name: "Wellness & Lifestyle" },
  { slug: "law-policy", icon: "⚖️", name: "Law & Policy" },
  { slug: "tech-innovation", icon: "🔬", name: "Tech & Innovation" },
  { slug: "arts-creativity", icon: "🎨", name: "Arts & Creativity" },
  { slug: "sports-performance", icon: "🏆", name: "Sports & Performance" },
  { slug: "social-impact", icon: "❤️", name: "Social Impact" },
  { slug: "food-hospitality", icon: "🍽️", name: "Food & Hospitality" },
];

export const creators: Creator[] = [
  {
    slug: "alexandra-m",
    initial: "A",
    tag: "Business & Strategy",
    categorySlug: "business-strategy",
    name: "Alexandra M.",
    role: "Founder & CEO, B2B SaaS",
    desc: "Founder of a SaaS company with a decade of frameworks on category creation. Turning talks into a flagship book and playbook suite.",
    badge: "Flagship Book Studio",
    focus: [
      "Category Creation",
      "Go-to-Market",
      "Positioning",
      "Founder Storytelling",
    ],
    bio: [
      "Alexandra has spent the last decade building and scaling a B2B SaaS company from a single idea into a category leader. Along the way she developed a body of frameworks on how new markets are named, framed, and won — frameworks she's taught from keynote stages and inside boardrooms for years.",
      "Working with Golden Shadow, she is consolidating that scattered IP — talks, internal decks, and operating playbooks — into a single flagship book and a companion playbook suite that her team and her industry can actually use.",
    ],
    projects: [
      {
        title: "The Category Architect (working title)",
        type: "Flagship Book",
        status: "In Production",
      },
      {
        title: "Positioning Playbook",
        type: "Playbook Suite",
        status: "In Development",
      },
      {
        title: "Founder Story Workshop",
        type: "IP Productization",
        status: "Planned",
      },
    ],
  },
  {
    slug: "david-o",
    initial: "D",
    tag: "Finance & Wealth",
    categorySlug: "finance-wealth",
    name: "David O.",
    role: "Fintech Executive & Keynote Speaker",
    desc: "Fintech executive and keynote speaker. Converting a decade of proprietary investment frameworks into a category-defining book.",
    badge: "IP Lab + Book",
    focus: [
      "Investment Frameworks",
      "Fintech Strategy",
      "Wealth Building",
      "Keynote Speaking",
    ],
    bio: [
      "David is a fintech executive and sought-after keynote speaker whose proprietary investment frameworks have guided institutions and individuals alike. For years his most valuable thinking lived only in talks and private client sessions.",
      "Through Golden Shadow's IP Lab, David is translating that expertise into a category-defining book and a structured product line — so his methodology can reach far beyond the rooms he speaks in.",
    ],
    projects: [
      {
        title: "Signal Over Noise (working title)",
        type: "Flagship Book",
        status: "In Production",
      },
      {
        title: "Investment Frameworks Toolkit",
        type: "IP Lab Product Suite",
        status: "In Development",
      },
    ],
  },
  {
    slug: "maya-j",
    initial: "M",
    tag: "Social Impact",
    categorySlug: "social-impact",
    name: "Maya J.",
    role: "Policy Leader & Advocate",
    desc: "Policy leader and advocate turning a decade of field-based frameworks into a practitioner guide used globally by organizations and funders.",
    badge: "Thought Leadership",
    focus: [
      "Policy Design",
      "Field Research",
      "Advocacy",
      "Funder Relations",
    ],
    bio: [
      "Maya is a policy leader and advocate who has spent a decade building practical frameworks in the field — tested with organizations, funders, and the communities they serve. Her work is widely referenced but, until now, never gathered in one place.",
      "With Golden Shadow, Maya is shaping that field-based knowledge into a practitioner guide designed to be used globally by organizations and the funders who back them.",
    ],
    projects: [
      {
        title: "The Practitioner's Field Guide (working title)",
        type: "Flagship Book",
        status: "In Production",
      },
      {
        title: "Funder Briefing Series",
        type: "Thought Leadership",
        status: "Ongoing",
      },
    ],
  },
  {
    slug: "renee-t",
    initial: "R",
    tag: "Media & Podcasting",
    categorySlug: "media-podcasting",
    name: "Renee T.",
    role: "Host, Top-50 Podcast",
    desc: "Host of a top-50 podcast. Translating 300 episodes and 5 years of creator interviews into a definitive guide for the next generation of media founders.",
    badge: "Flagship Book Studio",
    focus: [
      "Audience Building",
      "Creator Economy",
      "Interviewing",
      "Media Strategy",
    ],
    bio: [
      "Renee hosts a top-50 podcast and has spent five years and more than 300 episodes interviewing the people building modern media. The patterns across those conversations are a kind of IP in their own right.",
      "Golden Shadow is helping Renee distil that archive into a definitive guide for the next generation of media founders — a book that turns five years of interviews into a lasting, ownable asset.",
    ],
    projects: [
      {
        title: "The Media Founder's Playbook (working title)",
        type: "Flagship Book",
        status: "In Production",
      },
      {
        title: "Best-of Interview Anthology",
        type: "IP Productization",
        status: "Planned",
      },
    ],
  },
];

export const pricingTiers: PricingTier[] = [
  {
    slug: "starter",
    tier: "Starter",
    amount: "$750",
    per: "one-time · IP Audit session",
    desc: "For leaders who want clarity before committing to a full project. A 90-minute deep-dive session resulting in your Golden Shadow IP Blueprint.",
    features: [
      "90-min IP audit & discovery session",
      "IP Blueprint PDF (book concept + 3 product paths)",
      "12-month launch roadmap outline",
      "Credit applied to any full GSP project",
      "Access to GSP Creator Directory listing",
    ],
    cta: "Book IP Audit",
    checkout: {
      mode: "payment",
      unitAmount: 75000,
      productName: "Golden Shadow — IP Audit Session",
    },
  },
  {
    slug: "studio",
    tier: "Studio",
    amount: "$12,500",
    amountSuffix: "+",
    per: "project fee · Flagship Book",
    desc: "End-to-end flagship book production. You retain 100% of your IP and copyright. Optional royalty share available for co-investment editions.",
    features: [
      "Full book architecture & positioning",
      "Ghostwriting or developmental editing",
      "Copyediting, proofreading & design",
      "Print + ebook formatting & distribution",
      "Launch brief, media kit & Amazon listing",
      "Featured on GSP creator marketplace",
      "Optional: IP Lab product suite add-on",
    ],
    cta: "Apply for Studio",
    featured: true,
  },
  {
    slug: "platform",
    tier: "Platform",
    amount: "$2,500",
    per: "per month · Retainer",
    desc: "For executives and creators who want an ongoing fractional publishing partner — content, IP stewardship, and new releases on a continuous rhythm.",
    features: [
      "Quarterly IP planning sessions",
      "Monthly content calendar & ghostwriting",
      "Ongoing merch & product management",
      "Relaunch & special edition campaigns",
      "Analytics & revenue reporting",
      "Priority access to new GSP tools & features",
    ],
    cta: "Apply for Platform",
    checkout: {
      mode: "subscription",
      unitAmount: 250000,
      interval: "month",
      productName: "Golden Shadow — Platform Retainer",
    },
  },
];

export const journalPosts: JournalPost[] = [
  {
    slug: "keynote-to-book",
    tag: "Strategy",
    title: "From Keynote to Book: A Path for Busy Executives",
    excerpt:
      "How leaders with existing talks and frameworks can turn a single keynote into a high-signal book without derailing their day-to-day.",
    date: "May 2026",
    readTime: "6 min read",
    body: [
      "Most executives already have a book inside them — they just don't have the time to write it, and they're rightly skeptical of vanity projects that produce a forgettable PDF nobody reads.",
      "The good news is that the rawest, most valuable material is usually already done. A keynote you've given a dozen times is a tested argument. It has a thesis, a structure, and proof points that have survived contact with real audiences. That is the hardest part of a book, and you've already finished it.",
      "At Golden Shadow we start there. We immerse ourselves in your existing talks, transcripts, and frameworks, then architect a book around the spine that's already working. You stay in the role you're best at — the source of the ideas — while our editorial team does the heavy lifting of turning spoken insight into a durable, ownable asset.",
      "The result is not a transcript with a cover. It's a flagship book that becomes your business card, your sales tool, and your legacy — built in a fraction of the calendar time a from-scratch manuscript would demand.",
    ],
  },
  {
    slug: "what-hybrid-publisher-does",
    tag: "Publishing",
    title: "What a Premium Hybrid Publisher Actually Does for You",
    excerpt:
      "A candid look at the strategy, editing, design, and distribution that happens behind the scenes in a human-driven studio.",
    date: "April 2026",
    readTime: "7 min read",
    body: [
      "\"Hybrid publishing\" is a loaded term. For some it means a vanity press that takes your money and hands back a box of books. For others it means a true partnership that combines the creative control of self-publishing with the craft and distribution of a traditional house. The difference is everything.",
      "A premium hybrid publisher earns its place by doing the work a single author can't do alone, and doing it to a standard the market can feel. That starts with strategy: positioning the book so it actually lands with the right reader, and structuring it so the argument compounds chapter to chapter.",
      "From there it's craft — developmental editing, line editing, proofreading, and design that signals quality before a word is read. Then production: formatting for print and digital, metadata that makes the book findable, and distribution into the channels where your audience already buys.",
      "Crucially, you keep your IP. The hybrid model means you invest in production and retain full ownership and copyright — the publisher invests its expertise in strategy, craft, and reach. Done right, it's the best of both worlds.",
    ],
  },
  {
    slug: "framework-to-product-suite",
    tag: "IP & Products",
    title: "Turning a Framework Into a Product Suite",
    excerpt:
      "From a single slide to a playbook, workbook, and merch bundle that reinforces your book and makes your IP tangible and monetizable.",
    date: "March 2026",
    readTime: "5 min read",
    body: [
      "A single framework — the one slide everyone screenshots from your talk — is more valuable than most people realize. On its own it's a memorable idea. Packaged well, it's a product line.",
      "The path from slide to suite is a series of deliberate translations. The framework becomes a chapter, the chapter becomes a playbook, the playbook becomes a workbook your audience can actually run, and the most resonant phrase becomes a piece of merch that keeps the idea in the world.",
      "Each artifact reinforces the others. The book drives demand for the playbook; the workbook deepens the relationship; the merch turns readers into walking advertisements. Together they make your IP tangible, repeatable, and monetizable across multiple revenue streams.",
      "This is what we mean by IP productization: not slapping a logo on a mug, but engineering a coherent suite where every product makes the others more valuable — and all of it stays yours.",
    ],
  },
];

export const navLinks: { href: string; label: string }[] = [
  { href: "/#browse", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/creators", label: "Creators" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#how", label: "How It Works" },
  { href: "/journal", label: "Journal" },
];

// ── Lookup helpers ──────────────────────────────────────────
export function getCreatorBySlug(slug: string): Creator | undefined {
  return creators.find((c) => c.slug === slug);
}

export function getCreatorsByCategory(categorySlug: string): Creator[] {
  return creators.filter((c) => c.categorySlug === categorySlug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getJournalPostBySlug(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}

export function getPricingTierBySlug(slug: string): PricingTier | undefined {
  return pricingTiers.find((t) => t.slug === slug);
}

export function getCategoryCount(categorySlug: string): number {
  return creators.filter((c) => c.categorySlug === categorySlug).length;
}

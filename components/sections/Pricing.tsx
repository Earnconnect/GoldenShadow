import Link from "next/link";
import { pricingTiers } from "@/lib/data";

export default function Pricing() {
  return (
    <section id="pricing">
      <div className="pricing-intro">
        <p className="eyebrow">Pricing &amp; Plans</p>
        <h2>Simple structure, meaningful investment</h2>
        <p>
          We are hybrid, not vanity: you invest in production; we invest in
          strategy, craft, and distribution. You retain full IP ownership.
          Revenue sharing is available on select tiers.
        </p>
      </div>
      <div className="pricing-grid">
        {pricingTiers.map((tier) => (
          <div
            className={`price-card${tier.featured ? " featured" : ""}`}
            key={tier.slug}
          >
            <p className="price-tier">{tier.tier}</p>
            <div className="price-amount">
              {tier.amount}
              {tier.amountSuffix && (
                <span
                  style={{
                    fontSize: "20px",
                    fontFamily: "var(--sans)",
                    fontWeight: 300,
                  }}
                >
                  {tier.amountSuffix}
                </span>
              )}
            </div>
            <p className="price-per">{tier.per}</p>
            <p className="price-desc">{tier.desc}</p>
            <ul className="price-features">
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link
              href={tier.checkout ? `/api/checkout/${tier.slug}` : "/apply"}
              className="price-cta"
              prefetch={false}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="pricing-note">
        Custom packages available for enterprise and multi-title partnerships.
        All scopes discussed and agreed before work begins.
      </p>
    </section>
  );
}

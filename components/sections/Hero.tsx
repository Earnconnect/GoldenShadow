import HeroStats from "@/components/HeroStats";
import { getSettings } from "@/lib/settings";

export default async function Hero() {
  const settings = await getSettings();
  return (
    <section id="hero">
      <div className="hero-bg">
        <span>GS</span>
      </div>
      <div className="hero-content">
        <p className="eyebrow">{settings.heroEyebrow}</p>
        <h1 className="hero-head">
          Curated by the <em>obsessed,</em>
          <br />
          built for <em>legacy.</em>
        </h1>
        <p className="hero-sub">{settings.heroSubtitle}</p>
        <div className="hero-actions">
          <a href="#cta" className="btn-dark">
            Apply as a Creator
          </a>
          <a href="#cta" className="btn-outline">
            Partner as an Executive
          </a>
        </div>
        <p className="hero-micro">
          We partner with a curated number of creators and leaders each year.
        </p>
      </div>
      <a href="#browse" className="hero-scroll" aria-label="Scroll to explore">
        <span>Scroll</span>
        <i />
      </a>
      <HeroStats />
    </section>
  );
}

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Browse from "@/components/sections/Browse";
import Categories from "@/components/sections/Categories";
import Creators from "@/components/sections/Creators";
import HowItWorks from "@/components/sections/HowItWorks";
import Pricing from "@/components/sections/Pricing";
import Marketplace from "@/components/sections/Marketplace";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";
import Journal from "@/components/sections/Journal";
import CTA from "@/components/sections/CTA";
import Reveal from "@/components/Reveal";

// ISR: reflect creator edits (live DB) within a minute without going fully dynamic.
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Reveal>
          <Browse />
        </Reveal>
        <Reveal>
          <Categories />
        </Reveal>
        <Reveal>
          <Creators />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <Marketplace />
        </Reveal>
        <Reveal>
          <Process />
        </Reveal>
        <Reveal>
          <Testimonials />
        </Reveal>
        <Reveal>
          <Journal />
        </Reveal>
        <Reveal>
          <CTA />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

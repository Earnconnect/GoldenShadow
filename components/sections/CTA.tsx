import Link from "next/link";

export default function CTA() {
  return (
    <section id="cta">
      <h2>
        Ready to share your <em>expertise</em>
        <br />
        and get paid for it?
      </h2>
      <p>
        We review every application to ensure a strong fit. If it's not the
        right match, we'll point you to other trusted paths.
      </p>
      <Link href="/apply" className="btn-w">
        Apply to Join Golden Shadow
      </Link>
      <Link href="/login" className="cta-sub-link">
        Already a member? Log in →
      </Link>
    </section>
  );
}

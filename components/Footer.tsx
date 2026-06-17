import Link from "next/link";
import { navLinks } from "@/lib/data";

export default function Footer() {
  return (
    <footer>
      <span className="f-brand">Golden Shadow Publishing</span>
      <ul className="f-links">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
        <li>
          <Link href="/apply">Apply</Link>
        </li>
      </ul>
      <span className="f-copy">
        © 2026 Golden Shadow Publishing. All rights reserved.
      </span>
    </footer>
  );
}

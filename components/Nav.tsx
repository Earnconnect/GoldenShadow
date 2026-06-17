import Link from "next/link";
import { navLinks } from "@/lib/data";

export default function Nav() {
  return (
    <nav>
      <Link className="nav-logo" href="/">
        Golden Shadow Publishing
      </Link>
      <ul className="nav-center">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <div className="nav-right">
        <Link className="nav-sign" href="/login">
          Log In
        </Link>
        <Link className="btn-dark" href="/apply">
          Apply Now
        </Link>
      </div>
    </nav>
  );
}

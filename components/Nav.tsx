import Link from "next/link";
import { navLinks } from "@/lib/data";
import NavAuth from "@/components/NavAuth";
import MobileNav from "@/components/MobileNav";

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
      <NavAuth />
      <MobileNav />
    </nav>
  );
}

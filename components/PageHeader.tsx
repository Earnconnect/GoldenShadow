import Link from "next/link";

type Crumb = { href: string; label: string };

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <header className="page-head">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href}>
              <Link href={crumb.href}>{crumb.label}</Link>
              {i < breadcrumbs.length - 1 ? " / " : ""}
            </span>
          ))}
        </div>
      )}
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {subtitle && <p className="page-sub">{subtitle}</p>}
    </header>
  );
}

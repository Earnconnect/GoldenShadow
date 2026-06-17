import { createPublicClient } from "@/lib/supabase/public";
import {
  creators as staticCreators,
  getCreatorBySlug as getStaticCreatorBySlug,
  type Creator,
  type CreatorProject,
} from "@/lib/data";

// Shape of a row in the public.creators table.
type CreatorRow = {
  slug: string;
  initial: string | null;
  tag: string | null;
  category_slug: string | null;
  name: string;
  role: string | null;
  desc: string | null;
  badge: string | null;
  focus: string[] | null;
  bio: string[] | null;
  projects: CreatorProject[] | null;
  featured: boolean | null;
};

function rowToCreator(row: CreatorRow): Creator {
  // Fall back to the static seed for any field a creator hasn't filled in.
  const seed = getStaticCreatorBySlug(row.slug);
  return {
    slug: row.slug,
    initial: row.initial || seed?.initial || row.name.charAt(0).toUpperCase(),
    tag: row.tag || seed?.tag || "",
    categorySlug: row.category_slug || seed?.categorySlug || "",
    name: row.name || seed?.name || "",
    role: row.role || seed?.role || "",
    desc: row.desc || seed?.desc || "",
    badge: row.badge || seed?.badge || "",
    focus: row.focus?.length ? row.focus : seed?.focus ?? [],
    bio: row.bio?.length ? row.bio : seed?.bio ?? [],
    projects: row.projects?.length ? row.projects : seed?.projects ?? [],
    featured: row.featured ?? false,
  };
}

// Featured creators sort ahead, otherwise preserve order.
function sortFeatured(list: Creator[]): Creator[] {
  return [...list].sort(
    (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
  );
}

// Public profile lookup: DB row if it exists, else the static roster entry.
export async function getCreatorBySlug(
  slug: string
): Promise<Creator | undefined> {
  const supabase = createPublicClient();
  if (supabase) {
    const { data } = await supabase
      .from("creators")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return rowToCreator(data as CreatorRow);
  }
  return getStaticCreatorBySlug(slug);
}

// Stable slug list for generateStaticParams (the roster is the source of truth
// for which profiles exist).
export function getAllCreatorSlugs(): string[] {
  return staticCreators.map((c) => c.slug);
}

// Full roster, resolved against the DB (one query) with static fallback per row.
// The static roster defines which creators exist and their order; the DB
// supplies any edits a creator has saved.
export async function getAllCreators(): Promise<Creator[]> {
  const supabase = createPublicClient();
  if (supabase) {
    const { data } = await supabase.from("creators").select("*");
    if (data && data.length) {
      const rows = data as CreatorRow[];
      const bySlug = new Map(rows.map((r) => [r.slug, r]));
      // Static roster (with DB overrides) …
      const base = staticCreators.map((c) => {
        const row = bySlug.get(c.slug);
        return row ? rowToCreator(row) : c;
      });
      // … plus admin-created creators that aren't in the static roster.
      const staticSlugs = new Set(staticCreators.map((c) => c.slug));
      const extra = rows
        .filter((r) => !staticSlugs.has(r.slug))
        .map(rowToCreator);
      return sortFeatured([...base, ...extra]);
    }
  }
  return staticCreators;
}

export async function getCreatorsByCategory(
  categorySlug: string
): Promise<Creator[]> {
  const all = await getAllCreators();
  return all.filter((c) => c.categorySlug === categorySlug);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const all = await getAllCreators();
  const counts: Record<string, number> = {};
  for (const c of all) {
    counts[c.categorySlug] = (counts[c.categorySlug] ?? 0) + 1;
  }
  return counts;
}

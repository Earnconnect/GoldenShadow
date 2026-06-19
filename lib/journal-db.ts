import { createPublicClient } from "@/lib/supabase/public";
import {
  journalPosts as staticPosts,
  getJournalPostBySlug as getStaticPost,
  type JournalPost,
} from "@/lib/data";

type JournalRow = {
  slug: string;
  title: string;
  tag: string | null;
  excerpt: string | null;
  body: string[] | null;
  date: string | null;
  read_time: string | null;
  published: boolean;
  cover_url: string | null;
};

function rowToPost(r: JournalRow): JournalPost {
  return {
    slug: r.slug,
    tag: r.tag ?? "",
    title: r.title,
    excerpt: r.excerpt ?? "",
    date: r.date ?? "",
    readTime: r.read_time ?? "",
    body: r.body ?? [],
    coverUrl: r.cover_url ?? undefined,
  };
}

// Public list: static defaults overlaid/extended by DB-published posts.
// (RLS on the public client only returns published rows.)
export async function getPublishedPosts(): Promise<JournalPost[]> {
  const supabase = createPublicClient();
  if (supabase) {
    const { data } = await supabase
      .from("journal_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      const rows = data as JournalRow[];
      const dbBySlug = new Map(rows.map((r) => [r.slug, rowToPost(r)]));
      const merged = staticPosts.map((p) => dbBySlug.get(p.slug) ?? p);
      const extra = rows
        .filter((r) => !staticPosts.some((p) => p.slug === r.slug))
        .map(rowToPost);
      return [...extra, ...merged];
    }
  }
  return staticPosts;
}

export async function getPostBySlug(
  slug: string
): Promise<JournalPost | undefined> {
  const supabase = createPublicClient();
  if (supabase) {
    const { data } = await supabase
      .from("journal_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return rowToPost(data as JournalRow);
  }
  return getStaticPost(slug);
}

export function getAllJournalSlugs(): string[] {
  return staticPosts.map((p) => p.slug);
}

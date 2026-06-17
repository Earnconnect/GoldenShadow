import { categories, type Creator } from "@/lib/data";
import { saveCreator } from "@/app/admin/creators/actions";

// Server-rendered create/edit form for a creator (admin). Posts to saveCreator.
export default function CreatorAdminForm({
  creator,
}: {
  creator?: Creator;
}) {
  return (
    <form action={saveCreator} className="apply-form" style={{ maxWidth: "760px" }}>
      {creator && <input type="hidden" name="slug" value={creator.slug} />}
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="name">Name *</label>
          <input id="name" name="name" type="text" defaultValue={creator?.name ?? ""} required maxLength={120} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="role">Role / title</label>
          <input id="role" name="role" type="text" defaultValue={creator?.role ?? ""} maxLength={160} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="category_slug">Category</label>
          <select id="category_slug" name="category_slug" defaultValue={creator?.categorySlug ?? ""}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="tag">Category label (display)</label>
          <input id="tag" name="tag" type="text" defaultValue={creator?.tag ?? ""} placeholder="Business & Strategy" maxLength={60} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="initial">Avatar initial</label>
          <input id="initial" name="initial" type="text" defaultValue={creator?.initial ?? ""} maxLength={2} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="badge">Badge</label>
          <input id="badge" name="badge" type="text" defaultValue={creator?.badge ?? ""} placeholder="Flagship Book Studio" maxLength={60} />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="desc">Tagline</label>
        <textarea id="desc" name="desc" rows={2} defaultValue={creator?.desc ?? ""} maxLength={400} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="focus">
          Areas of focus <span className="label-hint">(comma-separated)</span>
        </label>
        <input id="focus" name="focus" type="text" defaultValue={(creator?.focus ?? []).join(", ")} maxLength={300} />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="bio">
          Bio <span className="label-hint">(blank line between paragraphs)</span>
        </label>
        <textarea id="bio" name="bio" rows={6} defaultValue={(creator?.bio ?? []).join("\n\n")} maxLength={4000} />
      </div>
      <label className="checkbox-row">
        <input type="checkbox" name="featured" defaultChecked={creator?.featured ?? false} /> Feature on homepage &amp; directory
      </label>
      <button type="submit" className="btn-dark">
        {creator ? "Save creator" : "Create creator"}
      </button>
    </form>
  );
}

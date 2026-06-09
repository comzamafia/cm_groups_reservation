import { createClient } from "@/lib/supabase/server";
import { CONTENT_DEFS } from "@/lib/content";
import { ContentEditor, type Field } from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("key, value");
  const overrides: Record<string, string> = {};
  for (const r of data ?? []) if (r.value != null) overrides[r.key] = r.value as string;

  const fields: Field[] = Object.entries(CONTENT_DEFS)
    .map(([key, def]) => ({
      key,
      grp: def.grp,
      label: def.label,
      type: def.type,
      sort: def.sort,
      value: overrides[key] ?? def.value,
    }))
    .sort((a, b) => (a.grp === b.grp ? a.sort - b.sort : 0));

  const notSetUp = !!error;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Website Content</h1>
          <p className="admin-sub">Edit the wording, menu labels and images on the public site.</p>
        </div>
      </div>

      {notSetUp && (
        <div className="login-error" style={{ marginBottom: 18 }}>
          The content table isn&apos;t set up yet. Run{" "}
          <code>supabase/migrations/0008_site_content.sql</code> in the SQL editor, then{" "}
          <code>node scripts/seed-content.mjs</code>. You can still edit below — saving will create the rows.
        </div>
      )}

      <ContentEditor fields={fields} />
    </>
  );
}

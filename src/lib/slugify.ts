export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^\x00-\x7F]/g, "")   // strip non-ASCII (Japanese etc.)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return slug || `setup-${Date.now()}`;
}

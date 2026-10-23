import { levenshtein, normalizeHeader } from "@/lib/utils/text";
import type { FieldDef, ImportSchema } from "./schemas";

/** Target field key → source column header (null = not mapped). */
export type Mapping = Record<string, string | null>;
export type MatchQuality = "exact" | "alias" | "fuzzy" | "none";

/**
 * Suggest a source column for every target field, from most to least confident:
 *   1. exact   – header equals the field's label or key ("Hours", "hours")
 *   2. alias   – header is a known spelling ("Hrs", "Proj Code")
 *   3. fuzzy   – header contains an alias or is one typo away ("Hours Logged ", "Employe")
 * Each pass runs over all fields before the next, so a strong match is never
 * stolen by a weaker one, and each source column is used at most once.
 * Users can override any suggestion; in production confirmed mappings are saved
 * per uploader so next month's file maps itself.
 */
export function autoMap(headers: string[], schema: ImportSchema) {
  const mapping: Mapping = {};
  const quality: Record<string, MatchQuality> = {};
  const used = new Set<string>();

  const assign = (field: FieldDef, matches: (header: string) => boolean, q: MatchQuality) => {
    if (mapping[field.key]) return;
    const hit = headers.find((h) => !used.has(h) && matches(h));
    if (!hit) return;
    mapping[field.key] = hit;
    quality[field.key] = q;
    used.add(hit);
  };

  for (const f of schema.fields) {
    assign(f, (h) => [f.label, f.key].some((x) => normalizeHeader(x) === normalizeHeader(h)), "exact");
  }
  for (const f of schema.fields) {
    assign(f, (h) => f.aliases.some((a) => normalizeHeader(a) === normalizeHeader(h)), "alias");
  }
  for (const f of schema.fields) {
    assign(
      f,
      (h) =>
        f.aliases.some((a) => {
          const alias = normalizeHeader(a);
          const header = normalizeHeader(h);
          return (alias.length > 3 && header.includes(alias)) || levenshtein(alias, header) <= 1;
        }),
      "fuzzy",
    );
  }
  for (const f of schema.fields) {
    if (!mapping[f.key]) {
      mapping[f.key] = null;
      quality[f.key] = "none";
    }
  }
  return { mapping, quality };
}

/** Required fields that still have no source column. */
export function missingRequired(mapping: Mapping, schema: ImportSchema): FieldDef[] {
  return schema.fields.filter((f) => f.required && !mapping[f.key]);
}

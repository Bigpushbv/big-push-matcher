import { prisma } from "./prisma";

/**
 * Given a company name, find all related company names via bedrijfsrelaties.
 * Searches both as moederbedrijf and verwantBedrijf to find the full tree.
 * Returns the set of all related company names (excluding the input name itself).
 */
export async function getRelatedCompanies(
  companyName: string,
  labelId: string | null
): Promise<string[]> {
  // Get all relations that apply (global + label-specific)
  const relations = await prisma.bedrijfsrelatie.findMany({
    where: {
      OR: [{ labelId: null }, ...(labelId ? [{ labelId }] : [])],
    },
  });

  const related = new Set<string>();
  const visited = new Set<string>();
  const queue = [companyName.toLowerCase()];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const rel of relations) {
      const moeder = rel.moederbedrijf.toLowerCase();
      const verwant = rel.verwantBedrijf.toLowerCase();

      if (moeder === current && !visited.has(verwant)) {
        related.add(rel.verwantBedrijf);
        queue.push(verwant);
      }
      if (verwant === current && !visited.has(moeder)) {
        related.add(rel.moederbedrijf);
        queue.push(moeder);
      }
    }
  }

  // Remove the original company name from results
  related.delete(companyName);
  return Array.from(related);
}

/**
 * Check if a candidate's exclusions (expanded with related companies)
 * conflict with a given company (also expanded with its related names).
 */
export async function checkExclusion(
  kandidaatUitsluitingen: string[],
  bedrijfsnaam: string,
  bedrijfBekendeMerken: string[],
  labelId: string
): Promise<{
  blocked: boolean;
  hardBlock: string[]; // Company names that are directly blocked
  softWarning: string[]; // Brand matches that warrant a warning
}> {
  // Expand all exclusions to include related companies
  const expandedExclusions = new Set<string>();
  for (const uitsluiting of kandidaatUitsluitingen) {
    expandedExclusions.add(uitsluiting.toLowerCase());
    const related = await getRelatedCompanies(uitsluiting, labelId);
    for (const r of related) {
      expandedExclusions.add(r.toLowerCase());
    }
  }

  // Get all names associated with the target company
  const bedrijfNamen = new Set<string>([bedrijfsnaam.toLowerCase()]);
  const relatedBedrijf = await getRelatedCompanies(bedrijfsnaam, labelId);
  for (const r of relatedBedrijf) {
    bedrijfNamen.add(r.toLowerCase());
  }

  // Check hard blocks: is the company (or any related name) in the exclusion list?
  const hardBlock: string[] = [];
  for (const naam of bedrijfNamen) {
    if (expandedExclusions.has(naam)) {
      hardBlock.push(naam);
    }
  }

  // Check soft warnings: do the company's known brands match any exclusion?
  const softWarning: string[] = [];
  for (const merk of bedrijfBekendeMerken) {
    if (expandedExclusions.has(merk.toLowerCase())) {
      softWarning.push(merk);
    }
  }

  return {
    blocked: hardBlock.length > 0,
    hardBlock,
    softWarning,
  };
}

import { prisma } from "./prisma";
import { checkExclusion } from "./exclusion";
import { scoreMatch } from "./ai";
import type {
  BedrijfMatch,
  KandidaatMatch,
  MatchResultBedrijven,
  MatchResultKandidaten,
} from "@/types";

// Province neighbor map for the Netherlands
const PROVINCIE_BUREN: Record<string, string[]> = {
  Groningen: ["Friesland", "Drenthe"],
  Friesland: ["Groningen", "Drenthe", "Overijssel", "Flevoland"],
  Drenthe: ["Groningen", "Friesland", "Overijssel"],
  Overijssel: ["Friesland", "Drenthe", "Gelderland", "Flevoland"],
  Flevoland: ["Friesland", "Overijssel", "Gelderland", "Utrecht", "Noord-Holland"],
  Gelderland: ["Overijssel", "Flevoland", "Utrecht", "Noord-Brabant", "Limburg", "Zuid-Holland"],
  Utrecht: ["Flevoland", "Gelderland", "Zuid-Holland", "Noord-Holland"],
  "Noord-Holland": ["Flevoland", "Utrecht", "Zuid-Holland"],
  "Zuid-Holland": ["Noord-Holland", "Utrecht", "Gelderland", "Noord-Brabant", "Zeeland"],
  Zeeland: ["Zuid-Holland", "Noord-Brabant"],
  "Noord-Brabant": ["Zuid-Holland", "Gelderland", "Limburg", "Zeeland"],
  Limburg: ["Gelderland", "Noord-Brabant"],
};

/**
 * Get provinces within reach based on travel willingness.
 * Laag = same province only
 * Gemiddeld = direct neighbors
 * Hoog = neighbors of neighbors (2 hops)
 * Landelijk = all provinces
 */
function getReachableProvinces(regio: string, reisbereidheid: string): Set<string> {
  const reachable = new Set<string>([regio]);

  if (reisbereidheid === "Landelijk") {
    return new Set(Object.keys(PROVINCIE_BUREN));
  }

  if (reisbereidheid === "Laag") {
    return reachable;
  }

  // Gemiddeld: add direct neighbors
  const neighbors = PROVINCIE_BUREN[regio] || [];
  for (const n of neighbors) {
    reachable.add(n);
  }

  if (reisbereidheid === "Hoog") {
    // Add neighbors of neighbors
    for (const n of neighbors) {
      const secondHop = PROVINCIE_BUREN[n] || [];
      for (const s of secondHop) {
        reachable.add(s);
      }
    }
  }

  return reachable;
}

/**
 * Flow A: Find matching companies for a candidate
 */
export async function matchKandidaatToBedrijven(
  kandidaatId: string,
  labelId: string,
  includeAiScoring = true
): Promise<MatchResultBedrijven> {
  const kandidaat = await prisma.kandidaat.findUnique({
    where: { id: kandidaatId },
    include: { introducties: true },
  });

  if (!kandidaat) throw new Error("Kandidaat niet gevonden");

  const bedrijven = await prisma.bedrijf.findMany({
    where: { labelId },
  });

  const existingIntros = await prisma.introductieTracking.findMany({
    where: { kandidaatId },
  });
  const introMap = new Map(
    existingIntros.map((i) => [i.bedrijfId, i.status])
  );

  const reachable = getReachableProvinces(
    kandidaat.regio,
    kandidaat.reisbereidheid
  );

  const direct: BedrijfMatch[] = [];
  const mogelijk: BedrijfMatch[] = [];
  const breed: BedrijfMatch[] = [];

  for (const bedrijf of bedrijven) {
    const warnings: string[] = [];

    // Check exclusion
    const exclusion = await checkExclusion(
      kandidaat.uitsluitingen,
      bedrijf.bedrijfsnaam,
      bedrijf.bekendeMerken,
      labelId
    );
    if (exclusion.blocked) continue;
    if (exclusion.softWarning.length > 0) {
      warnings.push(
        `Merken-waarschuwing: ${exclusion.softWarning.join(", ")}`
      );
    }

    // Check concurrentiebeding
    if (
      kandidaat.concurrentiebedingVerloopt &&
      kandidaat.concurrentiebedingVerloopt > new Date()
    ) {
      warnings.push(
        `Concurrentiebeding actief tot ${kandidaat.concurrentiebedingVerloopt.toLocaleDateString("nl-NL")}`
      );
    }

    // Skip already rejected or placed
    const introStatus = introMap.get(bedrijf.id);
    if (
      introStatus === "Afgewezen door bedrijf" ||
      introStatus === "Afgewezen door kandidaat" ||
      introStatus === "Geplaatst"
    ) {
      continue;
    }

    const match: BedrijfMatch = {
      bedrijf,
      groep: "Breed",
      introductieStatus: introStatus,
      warnings,
    };

    // Region matching
    if (bedrijf.werkgebiedType === "Landelijk" || bedrijf.zoektInRegios.length === 0) {
      match.groep = "Breed";
    } else {
      const directMatch = bedrijf.zoektInRegios.some(
        (r) => r.toLowerCase() === kandidaat.regio.toLowerCase()
      );
      if (directMatch) {
        match.groep = "Direct";
      } else {
        const mogelijkMatch = bedrijf.zoektInRegios.some((r) =>
          reachable.has(r)
        );
        if (mogelijkMatch) {
          match.groep = "Mogelijk";
        } else {
          continue; // Out of reach
        }
      }
    }

    // AI scoring
    if (includeAiScoring) {
      try {
        const { score, reasoning } = await scoreMatch(
          {
            specialismen: kandidaat.specialismen,
            korteOmschrijving: kandidaat.korteOmschrijving,
            regio: kandidaat.regio,
          },
          {
            bedrijfsnaam: bedrijf.bedrijfsnaam,
            sector: bedrijf.sector,
            bekendeMerken: bedrijf.bekendeMerken,
            zoektInRegios: bedrijf.zoektInRegios,
          }
        );
        match.aiScore = score;
        match.aiReasoning = reasoning;
      } catch {
        // AI scoring optional
      }
    }

    if (match.groep === "Direct") direct.push(match);
    else if (match.groep === "Mogelijk") mogelijk.push(match);
    else breed.push(match);
  }

  // Sort by AI score within groups
  const sortByScore = (a: BedrijfMatch, b: BedrijfMatch) =>
    (b.aiScore ?? 0) - (a.aiScore ?? 0);
  direct.sort(sortByScore);
  mogelijk.sort(sortByScore);
  breed.sort(sortByScore);

  return { direct, mogelijk, breed };
}

/**
 * Flow B: Find matching candidates for a company
 */
export async function matchBedrijfToKandidaten(
  bedrijfId: string,
  labelId: string,
  includeAiScoring = true
): Promise<MatchResultKandidaten> {
  const bedrijf = await prisma.bedrijf.findUnique({
    where: { id: bedrijfId },
  });

  if (!bedrijf) throw new Error("Bedrijf niet gevonden");

  const kandidaten = await prisma.kandidaat.findMany({
    where: {
      labelId,
      status: "Beschikbaar",
    },
  });

  const existingIntros = await prisma.introductieTracking.findMany({
    where: { bedrijfId },
  });
  const introMap = new Map(
    existingIntros.map((i) => [i.kandidaatId, i.status])
  );

  const direct: KandidaatMatch[] = [];
  const mogelijk: KandidaatMatch[] = [];
  const breed: KandidaatMatch[] = [];

  for (const kandidaat of kandidaten) {
    const warnings: string[] = [];

    // Check exclusion
    const exclusion = await checkExclusion(
      kandidaat.uitsluitingen,
      bedrijf.bedrijfsnaam,
      bedrijf.bekendeMerken,
      labelId
    );
    if (exclusion.blocked) continue;
    if (exclusion.softWarning.length > 0) {
      warnings.push(
        `Merken-waarschuwing: ${exclusion.softWarning.join(", ")}`
      );
    }

    // Check concurrentiebeding
    if (
      kandidaat.concurrentiebedingVerloopt &&
      kandidaat.concurrentiebedingVerloopt > new Date()
    ) {
      warnings.push(
        `Concurrentiebeding actief tot ${kandidaat.concurrentiebedingVerloopt.toLocaleDateString("nl-NL")}`
      );
    }

    // Skip already rejected or placed
    const introStatus = introMap.get(kandidaat.id);
    if (
      introStatus === "Afgewezen door bedrijf" ||
      introStatus === "Afgewezen door kandidaat" ||
      introStatus === "Geplaatst"
    ) {
      continue;
    }

    const reachable = getReachableProvinces(
      kandidaat.regio,
      kandidaat.reisbereidheid
    );

    const match: KandidaatMatch = {
      kandidaat,
      groep: "Breed",
      introductieStatus: introStatus,
      warnings,
    };

    // Region matching
    if (bedrijf.werkgebiedType === "Landelijk" || bedrijf.zoektInRegios.length === 0) {
      match.groep = "Breed";
    } else {
      const directMatch = bedrijf.zoektInRegios.some(
        (r) => r.toLowerCase() === kandidaat.regio.toLowerCase()
      );
      if (directMatch) {
        match.groep = "Direct";
      } else {
        const mogelijkMatch = bedrijf.zoektInRegios.some((r) =>
          reachable.has(r)
        );
        if (mogelijkMatch) {
          match.groep = "Mogelijk";
        } else {
          continue; // Out of reach
        }
      }
    }

    // AI scoring
    if (includeAiScoring) {
      try {
        const { score, reasoning } = await scoreMatch(
          {
            specialismen: kandidaat.specialismen,
            korteOmschrijving: kandidaat.korteOmschrijving,
            regio: kandidaat.regio,
          },
          {
            bedrijfsnaam: bedrijf.bedrijfsnaam,
            sector: bedrijf.sector,
            bekendeMerken: bedrijf.bekendeMerken,
            zoektInRegios: bedrijf.zoektInRegios,
          }
        );
        match.aiScore = score;
        match.aiReasoning = reasoning;
      } catch {
        // AI scoring optional
      }
    }

    if (match.groep === "Direct") direct.push(match);
    else if (match.groep === "Mogelijk") mogelijk.push(match);
    else breed.push(match);
  }

  // Sort by AI score within groups
  const sortByScore = (a: KandidaatMatch, b: KandidaatMatch) =>
    (b.aiScore ?? 0) - (a.aiScore ?? 0);
  direct.sort(sortByScore);
  mogelijk.sort(sortByScore);
  breed.sort(sortByScore);

  return { direct, mogelijk, breed };
}

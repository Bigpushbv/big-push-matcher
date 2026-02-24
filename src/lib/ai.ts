import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Score how well a candidate matches a company based on specialisms vs sector.
 */
export async function scoreMatch(
  kandidaat: {
    specialismen: string[];
    korteOmschrijving: string;
    regio: string;
  },
  bedrijf: {
    bedrijfsnaam: string;
    sector: string | null;
    bekendeMerken: string[];
    zoektInRegios: string[];
  }
): Promise<{ score: number; reasoning: string }> {
  const prompt = `Je bent een recruitment matching expert in de technische sector (deurtechniek, heftrucks, industriële apparatuur).

Beoordeel hoe goed deze kandidaat past bij dit bedrijf op een schaal van 1-10.

KANDIDAAT:
- Specialismen: ${kandidaat.specialismen.join(", ") || "niet opgegeven"}
- Korte omschrijving: ${kandidaat.korteOmschrijving}
- Regio: ${kandidaat.regio}

BEDRIJF:
- Naam: ${bedrijf.bedrijfsnaam}
- Sector: ${bedrijf.sector || "niet opgegeven"}
- Bekende merken: ${bedrijf.bekendeMerken.join(", ") || "niet opgegeven"}
- Zoekt in regio's: ${bedrijf.zoektInRegios.join(", ") || "landelijk"}

Geef je antwoord in dit exacte JSON-formaat:
{"score": <1-10>, "reasoning": "<1-2 zinnen in het Nederlands>"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      score: Math.min(10, Math.max(1, parsed.score)),
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("AI scoring failed:", error);
    return { score: 5, reasoning: "AI-scoring niet beschikbaar" };
  }
}

/**
 * Rewrite a candidate's short description tailored to a specific company.
 * Emphasizes relevant experience and removes the receiving company's name.
 */
export async function rewriteDescription(
  korteOmschrijving: string,
  kandidaatSpecialismen: string[],
  bedrijf: {
    bedrijfsnaam: string;
    sector: string | null;
    bekendeMerken: string[];
  },
  relatedBedrijfsnamen: string[]
): Promise<string> {
  const allBedrijfsnamen = [bedrijf.bedrijfsnaam, ...relatedBedrijfsnamen];

  const prompt = `Je bent een recruitment specialist. Herschrijf de korte omschrijving van een kandidaat voor een specifiek bedrijf.

REGELS:
1. Benadruk ervaring die relevant is voor het bedrijf (sector: ${bedrijf.sector || "niet opgegeven"}, merken: ${bedrijf.bekendeMerken.join(", ") || "niet opgegeven"})
2. Verwijder ALLE verwijzingen naar deze bedrijfsnamen: ${allBedrijfsnamen.join(", ")}
3. Houd het anoniem: geen naam, geen leeftijd, geen exacte jaren ervaring
4. Maximaal 2-3 zinnen
5. Schrijf in het Nederlands
6. Behoud de professionele toon

ORIGINELE OMSCHRIJVING:
${korteOmschrijving}

SPECIALISMEN KANDIDAAT: ${kandidaatSpecialismen.join(", ")}

ONTVANGENDE BEDRIJF: ${bedrijf.bedrijfsnaam}

Geef ALLEEN de herschreven omschrijving terug, geen uitleg of aanhalingstekens.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim();
  } catch (error) {
    console.error("AI description rewrite failed:", error);
    return korteOmschrijving;
  }
}

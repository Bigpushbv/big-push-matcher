import { prisma } from "./prisma";
import { rewriteDescription } from "./ai";
import { getRelatedCompanies } from "./exclusion";
import type { EmailGenereerRequest, EmailGenereerResult } from "@/types";

interface TemplateVariables {
  contactpersoon: string;
  bedrijfsnaam: string;
  kandidaat_lijst: string;
  mijn_naam: string;
  mijn_telefoon: string;
  afzender_naam: string;
  regio: string;
  datum: string;
  tijd: string;
  [key: string]: string;
}

function fillVariables(html: string, vars: TemplateVariables): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Generate a candidate list HTML block
 */
function generateKandidaatListHtml(
  kandidaten: Array<{
    referentiecode: string;
    regio: string;
    omschrijving: string;
    anoniemCvLink: string | null;
    lopendeProcesen: number;
  }>
): string {
  const rows = kandidaten
    .map((k) => {
      const codeLink = k.anoniemCvLink
        ? `<a href="${k.anoniemCvLink}" style="color: #2563eb; text-decoration: underline; font-weight: bold;">${k.referentiecode}</a>`
        : `<strong>${k.referentiecode}</strong>`;

      return `<tr style="border-bottom: 1px solid #e5e7eb;">
  <td style="padding: 12px 16px; vertical-align: top;">${codeLink}</td>
  <td style="padding: 12px 16px; vertical-align: top;">${k.regio}</td>
  <td style="padding: 12px 16px; vertical-align: top;">${k.omschrijving}</td>
  <td style="padding: 12px 16px; vertical-align: top; text-align: center;">${k.lopendeProcesen}</td>
</tr>`;
    })
    .join("\n");

  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
      <th style="padding: 12px 16px; text-align: left;">Code</th>
      <th style="padding: 12px 16px; text-align: left;">Regio</th>
      <th style="padding: 12px 16px; text-align: left;">Profiel</th>
      <th style="padding: 12px 16px; text-align: center;">Processen</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>`;
}

/**
 * Assemble a full email from a template, candidates, and company.
 */
export async function generateEmail(
  request: EmailGenereerRequest
): Promise<EmailGenereerResult> {
  // Fetch template with blocks
  const template = await prisma.emailTemplate.findUnique({
    where: { id: request.templateId },
    include: {
      blokken: {
        include: { blok: true },
        orderBy: { volgorde: "asc" },
      },
    },
  });
  if (!template) throw new Error("Template niet gevonden");

  // Fetch company
  const bedrijf = await prisma.bedrijf.findUnique({
    where: { id: request.bedrijfId },
  });
  if (!bedrijf) throw new Error("Bedrijf niet gevonden");

  // Fetch candidates
  const kandidaten = await prisma.kandidaat.findMany({
    where: { id: { in: request.kandidaatIds } },
  });

  // Get related company names for AI rewriting
  const relatedNames = await getRelatedCompanies(
    bedrijf.bedrijfsnaam,
    bedrijf.labelId
  );

  // AI-rewrite descriptions per candidate
  const omschrijvingen: Record<string, string> = {};
  for (const k of kandidaten) {
    if (request.aangepasOmschrijvingen?.[k.id]) {
      // User already provided a custom description
      omschrijvingen[k.id] = request.aangepasOmschrijvingen[k.id];
    } else {
      omschrijvingen[k.id] = await rewriteDescription(
        k.korteOmschrijving,
        k.specialismen,
        {
          bedrijfsnaam: bedrijf.bedrijfsnaam,
          sector: bedrijf.sector,
          bekendeMerken: bedrijf.bekendeMerken,
        },
        relatedNames
      );
    }
  }

  // Generate candidate list HTML
  const kandidaatListHtml = generateKandidaatListHtml(
    kandidaten.map((k) => ({
      referentiecode: k.referentiecode,
      regio: k.regio,
      omschrijving: omschrijvingen[k.id],
      anoniemCvLink: k.anoniemCvLink,
      lopendeProcesen: k.lopendeProcesen,
    }))
  );

  // Build variables
  const vars: TemplateVariables = {
    contactpersoon: bedrijf.contactpersoon,
    bedrijfsnaam: bedrijf.bedrijfsnaam,
    kandidaat_lijst: kandidaatListHtml,
    mijn_naam: "Nick", // TODO: make configurable per user
    mijn_telefoon: "", // TODO: make configurable per user
    afzender_naam: "Nick",
    regio:
      bedrijf.zoektInRegios.length > 0
        ? bedrijf.zoektInRegios.join(", ")
        : "Landelijk",
    datum: new Date().toLocaleDateString("nl-NL"),
    tijd: new Date().toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  // Assemble blocks
  let bodyHtml = "";

  // Add custom paragraph if provided
  if (request.customParagraaf) {
    bodyHtml += `<p>${request.customParagraaf}</p>\n`;
  }

  for (const tb of template.blokken) {
    const blok = tb.blok;
    if (blok.type === "kandidatenlijst") {
      bodyHtml += kandidaatListHtml + "\n";
    } else {
      bodyHtml += fillVariables(blok.bodyHtml, vars) + "\n";
    }
  }

  // Fill subject
  const onderwerpHtml = fillVariables(template.onderwerpTemplate, vars);

  return {
    onderwerpHtml,
    bodyHtml,
    kandidaatOmschrijvingen: omschrijvingen,
  };
}

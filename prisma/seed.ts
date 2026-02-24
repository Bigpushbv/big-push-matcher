import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create labels
  const deurtechniekNL = await prisma.label.upsert({
    where: { prefix: "DM" },
    update: {},
    create: {
      naam: "Deurtechniek NL",
      prefix: "DM",
      land: "NL",
      taal: "nl",
      vlag: "\u{1F1F3}\u{1F1F1}",
      status: "Actief",
      huidigeVolgnummer: 0,
    },
  });

  const heftrucksNL = await prisma.label.upsert({
    where: { prefix: "HT" },
    update: {},
    create: {
      naam: "Heftrucks NL",
      prefix: "HT",
      land: "NL",
      taal: "nl",
      vlag: "\u{1F1F3}\u{1F1F1}",
      status: "Actief",
      huidigeVolgnummer: 0,
    },
  });

  const deurtechniekDE = await prisma.label.upsert({
    where: { prefix: "DD" },
    update: {},
    create: {
      naam: "Deurtechniek DE",
      prefix: "DD",
      land: "DE",
      taal: "de",
      vlag: "\u{1F1E9}\u{1F1EA}",
      status: "Actief",
      huidigeVolgnummer: 0,
    },
  });

  console.log("Labels created:", { deurtechniekNL, heftrucksNL, deurtechniekDE });

  // Create company relations (global — labelId = null)
  const relaties = [
    { moederbedrijf: "ASSA ABLOY", verwantBedrijf: "Nassau Door", type: "Dochter" },
    { moederbedrijf: "ASSA ABLOY", verwantBedrijf: "Alsta Nassau", type: "Historische naam" },
    { moederbedrijf: "ASSA ABLOY", verwantBedrijf: "AAproTec", type: "Zuster" },
    { moederbedrijf: "H\u00f6rmann", verwantBedrijf: "CCP", type: "Dochter" },
    { moederbedrijf: "H\u00f6rmann", verwantBedrijf: "DSN", type: "Dochter" },
  ];

  for (const rel of relaties) {
    await prisma.bedrijfsrelatie.upsert({
      where: {
        id: `seed-${rel.moederbedrijf}-${rel.verwantBedrijf}`.toLowerCase().replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: `seed-${rel.moederbedrijf}-${rel.verwantBedrijf}`.toLowerCase().replace(/\s+/g, "-"),
        labelId: null,
        moederbedrijf: rel.moederbedrijf,
        verwantBedrijf: rel.verwantBedrijf,
        type: rel.type,
      },
    });
  }

  console.log("Company relations seeded.");

  // Create default email blocks for Deurtechniek NL
  const introBlok = await prisma.emailBlok.create({
    data: {
      labelId: deurtechniekNL.id,
      bloknaam: "Introductie",
      type: "statisch",
      bodyHtml: `<p>Beste {{contactpersoon}},</p>
<p>Vanuit Big Push Recruitment wil ik u graag wijzen op een interessante kandidaat voor {{bedrijfsnaam}}.</p>`,
      variabelen: ["contactpersoon", "bedrijfsnaam"],
      volgorde: 1,
    },
  });

  const kandidatenBlok = await prisma.emailBlok.create({
    data: {
      labelId: deurtechniekNL.id,
      bloknaam: "Kandidatenlijst",
      type: "kandidatenlijst",
      bodyHtml: `{{kandidaat_lijst}}`,
      variabelen: ["kandidaat_lijst"],
      volgorde: 2,
    },
  });

  const ctaBlok = await prisma.emailBlok.create({
    data: {
      labelId: deurtechniekNL.id,
      bloknaam: "CTA belafspraak",
      type: "statisch",
      bodyHtml: `<p>Mocht u interesse hebben in een kennismakingsgesprek met bovenstaande kandidaat/kandidaten, dan hoor ik dat graag. Ik ben bereikbaar op {{mijn_telefoon}} of via dit e-mailadres.</p>`,
      variabelen: ["mijn_telefoon"],
      volgorde: 3,
    },
  });

  const handtekeningBlok = await prisma.emailBlok.create({
    data: {
      labelId: deurtechniekNL.id,
      bloknaam: "Handtekening",
      type: "handtekening",
      bodyHtml: `<p>Met vriendelijke groet,</p>
<p>{{afzender_naam}}<br/>Big Push Recruitment<br/>{{mijn_telefoon}}</p>`,
      variabelen: ["afzender_naam", "mijn_telefoon"],
      volgorde: 4,
    },
  });

  // Create default template
  const template = await prisma.emailTemplate.create({
    data: {
      labelId: deurtechniekNL.id,
      templateNaam: "Introductiemail nieuw bedrijf",
      onderwerpTemplate: "Kandidaat introductie voor {{bedrijfsnaam}}",
      blokken: {
        create: [
          { blokId: introBlok.id, volgorde: 1 },
          { blokId: kandidatenBlok.id, volgorde: 2 },
          { blokId: ctaBlok.id, volgorde: 3 },
          { blokId: handtekeningBlok.id, volgorde: 4 },
        ],
      },
    },
  });

  console.log("Default email blocks and template created:", template.templateNaam);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return NextResponse.json({ error: "labelId is verplicht" }, { status: 400 });
  }

  const status = searchParams.get("status");
  const regio = searchParams.get("regio");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { labelId };
  if (status) where.status = status;
  if (regio) where.regio = regio;
  if (search) {
    where.OR = [
      { naam: { contains: search, mode: "insensitive" } },
      { referentiecode: { contains: search, mode: "insensitive" } },
      { woonplaats: { contains: search, mode: "insensitive" } },
    ];
  }

  const kandidaten = await prisma.kandidaat.findMany({
    where,
    orderBy: { aangemaaktOp: "desc" },
    include: {
      introducties: {
        include: { bedrijf: true },
      },
    },
  });

  return NextResponse.json(kandidaten);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { labelId, naam, woonplaats, regio, korteOmschrijving, ...rest } = body;

  if (!labelId || !naam || !woonplaats || !regio) {
    return NextResponse.json(
      { error: "labelId, naam, woonplaats en regio zijn verplicht" },
      { status: 400 }
    );
  }

  // Generate referentiecode: atomic increment of label's volgnummer
  const label = await prisma.label.update({
    where: { id: labelId },
    data: { huidigeVolgnummer: { increment: 1 } },
  });

  const referentiecode = `${label.prefix}${String(label.huidigeVolgnummer).padStart(2, "0")}`;

  const kandidaat = await prisma.kandidaat.create({
    data: {
      labelId,
      referentiecode,
      naam,
      woonplaats,
      regio,
      korteOmschrijving: korteOmschrijving || "",
      specialismen: rest.specialismen || [],
      uitsluitingen: rest.uitsluitingen || [],
      concurrentiebedingTekst: rest.concurrentiebedingTekst || null,
      concurrentiebedingVerloopt: rest.concurrentiebedingVerloopt
        ? new Date(rest.concurrentiebedingVerloopt)
        : null,
      salariseis: rest.salariseis || null,
      zoekprofiel: rest.zoekprofiel || null,
      reisbereidheid: rest.reisbereidheid || "Gemiddeld",
      anoniemCvLink: rest.anoniemCvLink || null,
      uitgebreidCvLink: rest.uitgebreidCvLink || null,
      notities: rest.notities || null,
    },
  });

  // Create actie log
  await prisma.actieLog.create({
    data: {
      kandidaatId: kandidaat.id,
      actie: `Kandidaat ${referentiecode} aangemaakt`,
      automatisch: true,
    },
  });

  return NextResponse.json(kandidaat, { status: 201 });
}

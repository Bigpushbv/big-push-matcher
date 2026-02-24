import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bedrijfId, kandidaatIds } = body;

  if (!bedrijfId || !kandidaatIds?.length) {
    return NextResponse.json(
      { error: "bedrijfId en kandidaatIds zijn verplicht" },
      { status: 400 }
    );
  }

  const bedrijf = await prisma.bedrijf.findUnique({
    where: { id: bedrijfId },
    select: { bedrijfsnaam: true },
  });

  // Update tracking for each candidate
  for (const kandidaatId of kandidaatIds) {
    await prisma.introductieTracking.upsert({
      where: {
        kandidaatId_bedrijfId: { kandidaatId, bedrijfId },
      },
      update: {
        status: "Ge\u00efntroduceerd",
      },
      create: {
        kandidaatId,
        bedrijfId,
        status: "Ge\u00efntroduceerd",
      },
    });

    const kandidaat = await prisma.kandidaat.findUnique({
      where: { id: kandidaatId },
      select: { referentiecode: true },
    });

    await prisma.actieLog.create({
      data: {
        kandidaatId,
        bedrijfId,
        actie: `E-mail verstuurd: ${kandidaat?.referentiecode} ge\u00efntroduceerd bij ${bedrijf?.bedrijfsnaam}`,
        automatisch: true,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { kandidaatId, bedrijfId, status, notities } = body;

  if (!kandidaatId || !bedrijfId || !status) {
    return NextResponse.json(
      { error: "kandidaatId, bedrijfId en status zijn verplicht" },
      { status: 400 }
    );
  }

  const tracking = await prisma.introductieTracking.upsert({
    where: {
      kandidaatId_bedrijfId: { kandidaatId, bedrijfId },
    },
    update: {
      status,
      notities: notities ?? undefined,
    },
    create: {
      kandidaatId,
      bedrijfId,
      status,
      notities: notities || null,
    },
  });

  // Auto-log status change
  const kandidaat = await prisma.kandidaat.findUnique({
    where: { id: kandidaatId },
    select: { referentiecode: true },
  });
  const bedrijf = await prisma.bedrijf.findUnique({
    where: { id: bedrijfId },
    select: { bedrijfsnaam: true },
  });

  await prisma.actieLog.create({
    data: {
      kandidaatId,
      bedrijfId,
      actie: `Status ${kandidaat?.referentiecode} bij ${bedrijf?.bedrijfsnaam} gewijzigd naar: ${status}`,
      automatisch: true,
    },
  });

  return NextResponse.json(tracking);
}

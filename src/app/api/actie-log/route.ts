import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kandidaatId = searchParams.get("kandidaatId");
  const bedrijfId = searchParams.get("bedrijfId");

  const where: Record<string, unknown> = {};
  if (kandidaatId) where.kandidaatId = kandidaatId;
  if (bedrijfId) where.bedrijfId = bedrijfId;

  const logs = await prisma.actieLog.findMany({
    where,
    orderBy: { datum: "desc" },
    take: 50,
    include: {
      kandidaat: { select: { referentiecode: true, naam: true } },
      bedrijf: { select: { bedrijfsnaam: true } },
    },
  });

  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { kandidaatId, bedrijfId, actie } = body;

  if (!actie) {
    return NextResponse.json(
      { error: "actie is verplicht" },
      { status: 400 }
    );
  }

  const log = await prisma.actieLog.create({
    data: {
      kandidaatId: kandidaatId || null,
      bedrijfId: bedrijfId || null,
      actie,
      automatisch: false,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

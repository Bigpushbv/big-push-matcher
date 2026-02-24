import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return NextResponse.json({ error: "labelId is verplicht" }, { status: 400 });
  }

  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { labelId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { bedrijfsnaam: { contains: search, mode: "insensitive" } },
      { contactpersoon: { contains: search, mode: "insensitive" } },
    ];
  }

  const bedrijven = await prisma.bedrijf.findMany({
    where,
    orderBy: { aangemaaktOp: "desc" },
    include: {
      introducties: {
        include: { kandidaat: true },
      },
    },
  });

  return NextResponse.json(bedrijven);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { labelId, bedrijfsnaam, contactpersoon, email, ...rest } = body;

  if (!labelId || !bedrijfsnaam || !contactpersoon || !email) {
    return NextResponse.json(
      { error: "labelId, bedrijfsnaam, contactpersoon en email zijn verplicht" },
      { status: 400 }
    );
  }

  const bedrijf = await prisma.bedrijf.create({
    data: {
      labelId,
      bedrijfsnaam,
      contactpersoon,
      email,
      telefoon: rest.telefoon || null,
      status: rest.status || "Prospect",
      zoektInRegios: rest.zoektInRegios || [],
      werkgebiedType: rest.werkgebiedType || "Landelijk",
      sector: rest.sector || null,
      bekendeMerken: rest.bekendeMerken || [],
      notities: rest.notities || null,
    },
  });

  // Create actie log
  await prisma.actieLog.create({
    data: {
      bedrijfId: bedrijf.id,
      actie: `Bedrijf ${bedrijfsnaam} aangemaakt`,
      automatisch: true,
    },
  });

  return NextResponse.json(bedrijf, { status: 201 });
}

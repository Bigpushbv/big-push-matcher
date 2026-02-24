import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const kandidaat = await prisma.kandidaat.findUnique({
    where: { id },
    include: {
      introducties: {
        include: { bedrijf: true },
        orderBy: { datumLaatstGewijzigd: "desc" },
      },
      actieLogs: {
        orderBy: { datum: "desc" },
      },
      label: true,
    },
  });

  if (!kandidaat) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  return NextResponse.json(kandidaat);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Handle date conversion
  if (body.concurrentiebedingVerloopt) {
    body.concurrentiebedingVerloopt = new Date(body.concurrentiebedingVerloopt);
  }

  const kandidaat = await prisma.kandidaat.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(kandidaat);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete related records first
  await prisma.actieLog.deleteMany({ where: { kandidaatId: id } });
  await prisma.introductieTracking.deleteMany({ where: { kandidaatId: id } });
  await prisma.kandidaat.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

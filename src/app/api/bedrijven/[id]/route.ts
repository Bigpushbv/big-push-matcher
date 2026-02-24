import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bedrijf = await prisma.bedrijf.findUnique({
    where: { id },
    include: {
      introducties: {
        include: { kandidaat: true },
        orderBy: { datumLaatstGewijzigd: "desc" },
      },
      actieLogs: {
        orderBy: { datum: "desc" },
      },
      label: true,
    },
  });

  if (!bedrijf) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  return NextResponse.json(bedrijf);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const bedrijf = await prisma.bedrijf.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(bedrijf);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.actieLog.deleteMany({ where: { bedrijfId: id } });
  await prisma.introductieTracking.deleteMany({ where: { bedrijfId: id } });
  await prisma.bedrijf.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

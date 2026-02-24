import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  // Get global relations (labelId=null) + label-specific
  const where = labelId
    ? { OR: [{ labelId: null }, { labelId }] }
    : { labelId: null };

  const relaties = await prisma.bedrijfsrelatie.findMany({
    where,
    orderBy: { moederbedrijf: "asc" },
  });

  return NextResponse.json(relaties);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { moederbedrijf, verwantBedrijf, type, labelId } = body;

  if (!moederbedrijf || !verwantBedrijf || !type) {
    return NextResponse.json(
      { error: "moederbedrijf, verwantBedrijf en type zijn verplicht" },
      { status: 400 }
    );
  }

  const relatie = await prisma.bedrijfsrelatie.create({
    data: {
      moederbedrijf,
      verwantBedrijf,
      type,
      labelId: labelId || null,
    },
  });

  return NextResponse.json(relatie, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is verplicht" }, { status: 400 });
  }

  await prisma.bedrijfsrelatie.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

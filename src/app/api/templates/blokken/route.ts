import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return NextResponse.json({ error: "labelId is verplicht" }, { status: 400 });
  }

  const blokken = await prisma.emailBlok.findMany({
    where: { labelId },
    orderBy: { volgorde: "asc" },
  });

  return NextResponse.json(blokken);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { labelId, bloknaam, type, bodyHtml, variabelen, volgorde } = body;

  if (!labelId || !bloknaam || !type) {
    return NextResponse.json(
      { error: "labelId, bloknaam en type zijn verplicht" },
      { status: 400 }
    );
  }

  const blok = await prisma.emailBlok.create({
    data: {
      labelId,
      bloknaam,
      type,
      bodyHtml: bodyHtml || "",
      variabelen: variabelen || [],
      volgorde: volgorde || 0,
    },
  });

  return NextResponse.json(blok, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is verplicht" }, { status: 400 });
  }

  const blok = await prisma.emailBlok.update({
    where: { id },
    data,
  });

  return NextResponse.json(blok);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is verplicht" }, { status: 400 });
  }

  await prisma.emailBlok.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

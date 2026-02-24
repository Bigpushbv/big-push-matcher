import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return NextResponse.json({ error: "labelId is verplicht" }, { status: 400 });
  }

  const templates = await prisma.emailTemplate.findMany({
    where: { labelId },
    include: {
      blokken: {
        include: { blok: true },
        orderBy: { volgorde: "asc" },
      },
    },
    orderBy: { templateNaam: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { labelId, templateNaam, onderwerpTemplate, blokIds } = body;

  if (!labelId || !templateNaam || !onderwerpTemplate) {
    return NextResponse.json(
      { error: "labelId, templateNaam en onderwerpTemplate zijn verplicht" },
      { status: 400 }
    );
  }

  const template = await prisma.emailTemplate.create({
    data: {
      labelId,
      templateNaam,
      onderwerpTemplate,
      blokken: {
        create: (blokIds || []).map((blokId: string, index: number) => ({
          blokId,
          volgorde: index + 1,
        })),
      },
    },
    include: {
      blokken: { include: { blok: true }, orderBy: { volgorde: "asc" } },
    },
  });

  return NextResponse.json(template, { status: 201 });
}

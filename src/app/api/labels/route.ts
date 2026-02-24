import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(labels);
  } catch (e: unknown) {
    const error = e as Error;
    console.error("GET /api/labels error:", error.message);
    return NextResponse.json(
      { error: "Database error", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { naam, prefix, land, taal, vlag } = body;

  if (!naam || !prefix || !land || !taal || !vlag) {
    return NextResponse.json(
      { error: "Alle velden zijn verplicht" },
      { status: 400 }
    );
  }

  const existing = await prisma.label.findUnique({ where: { prefix } });
  if (existing) {
    return NextResponse.json(
      { error: "Prefix is al in gebruik" },
      { status: 409 }
    );
  }

  const label = await prisma.label.create({
    data: { naam, prefix, land, taal, vlag },
  });

  return NextResponse.json(label, { status: 201 });
}

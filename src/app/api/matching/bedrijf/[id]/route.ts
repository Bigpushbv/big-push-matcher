import { NextRequest, NextResponse } from "next/server";
import { matchBedrijfToKandidaten } from "@/lib/matching";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { labelId, includeAiScoring = true } = body;

  if (!labelId) {
    return NextResponse.json({ error: "labelId is verplicht" }, { status: 400 });
  }

  try {
    const result = await matchBedrijfToKandidaten(id, labelId, includeAiScoring);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matching mislukt" },
      { status: 500 }
    );
  }
}

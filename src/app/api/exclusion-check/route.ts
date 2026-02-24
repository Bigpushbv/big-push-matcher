import { NextRequest, NextResponse } from "next/server";
import { getRelatedCompanies } from "@/lib/exclusion";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { companyName, labelId } = body;

  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is verplicht" },
      { status: 400 }
    );
  }

  const related = await getRelatedCompanies(companyName, labelId || null);
  return NextResponse.json({ companyName, related });
}

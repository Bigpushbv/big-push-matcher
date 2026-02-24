import { NextRequest, NextResponse } from "next/server";
import { generateEmail } from "@/lib/email-generator";
import type { EmailGenereerRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body: EmailGenereerRequest = await request.json();

  if (!body.templateId || !body.bedrijfId || !body.kandidaatIds?.length) {
    return NextResponse.json(
      { error: "templateId, bedrijfId en kandidaatIds zijn verplicht" },
      { status: 400 }
    );
  }

  try {
    const result = await generateEmail(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email generatie mislukt" },
      { status: 500 }
    );
  }
}

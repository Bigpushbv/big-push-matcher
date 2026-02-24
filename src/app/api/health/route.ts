import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.substring(0, 30) + "..."
        : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    const labels = await prisma.label.findMany({ take: 1 });
    checks.database = {
      status: "connected",
      labelCount: labels.length,
    };
  } catch (e: unknown) {
    const error = e as Error;
    checks.database = {
      status: "error",
      message: error.message,
      name: error.constructor?.name,
    };
  }

  const allOk = (checks.database as Record<string, unknown>)?.status === "connected";
  return NextResponse.json(checks, { status: allOk ? 200 : 500 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, no auth — pilgrims need to see this without logging in.
export async function GET() {
  const latest = await prisma.heatAdvisory.findFirst({
    orderBy: { pushedAt: "desc" },
  });

  if (!latest) return NextResponse.json({ advisory: null });

  return NextResponse.json({
    advisory: {
      routeSegment: latest.routeSegment,
      heatIndex: latest.heatIndex,
      textEn: latest.advisoryTextEn,
      textMr: latest.advisoryTextMr,
      pushedAt: latest.pushedAt,
    },
  });
}
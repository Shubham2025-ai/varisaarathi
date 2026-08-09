import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ qrCode: string }> }) {
  const session = await requireRole(["VOLUNTEER", "DOCTOR", "DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { qrCode } = await params;

  const warkari = await prisma.warkariProfile.findUnique({
    where: { qrCode },
    select: {
      id: true,
      name: true,
      gender: true,
      dob: true,
      bloodGroup: true,
      riskBadge: true,
      healthSummary: true,
      dindi: { select: { name: true } },
    },
  });

  if (!warkari) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ warkari });
}
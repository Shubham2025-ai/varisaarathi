import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole(["DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const camps = await prisma.camp.findMany({ where: { active: true } });
  return NextResponse.json({ camps });
}
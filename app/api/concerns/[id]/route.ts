import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const bodySchema = z.object({ status: z.enum(["QUEUED", "IN_REVIEW", "RESOLVED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const concern = await prisma.concern.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ concernId: concern.id, status: concern.status });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const bodySchema = z.object({ responderId: z.string() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "responderId required" }, { status: 400 });

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      assignedResponderId: parsed.data.responderId,
      status: "RESPONDER_ASSIGNED",
      assignedAt: new Date(),
    },
  });

  return NextResponse.json({ alertId: alert.id, status: alert.status });
}
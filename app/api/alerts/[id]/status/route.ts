import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const bodySchema = z.object({ status: z.enum(["EN_ROUTE", "RESOLVED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["RESPONDER", "DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const timestampField = parsed.data.status === "EN_ROUTE" ? "enRouteAt" : "resolvedAt";

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      status: parsed.data.status,
      [timestampField]: new Date(),
    },
  });

  return NextResponse.json({ alertId: alert.id, status: alert.status });
}
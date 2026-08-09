import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const createAlertSchema = z.object({
  warkariId: z.string().optional(),
  type: z.enum(["MEDICAL", "HEAT_RISK", "SAFETY", "LOST_ELDERLY", "THEFT"]),
  triggerChannel: z.enum(["APP", "SMS", "MISSED_CALL", "VOLUNTEER_SCAN"]),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

// POST /api/alerts — deliberately NO auth requirement (SOS must stay
// login-free), but rate-limited per IP to prevent spam floods. 10 requests
// per 5 minutes is generous for a genuine emergency (multiple alert types,
// retries on network failure) while blocking automated abuse.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`alerts:${ip}`, 10, 5 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = createAlertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert payload" }, { status: 400 });
  }

  const { warkariId, type, triggerChannel, latitude, longitude } = parsed.data;

  const alert = await prisma.alert.create({
    data: {
      warkariId,
      type,
      triggerChannel,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      locationSource: latitude != null ? "gps" : null,
      status: "OPEN",
    },
  });

  return NextResponse.json({ alertId: alert.id, status: alert.status }, { status: 201 });
}

// GET /api/alerts?status=OPEN — role-gated.
export async function GET(req: NextRequest) {
  const session = await requireRole(["DISPATCHER", "ADMIN", "RESPONDER"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get("status");

  const alerts = await prisma.alert.findMany({
    where: statusParam ? { status: statusParam as any } : undefined,
    include: { warkari: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ alerts });
}
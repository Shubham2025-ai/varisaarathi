import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const createConcernSchema = z.object({
  category: z.enum(["OVERCHARGED_FACILITY", "SANITATION", "WATER_FOOD_QUALITY", "OTHER"]),
  description: z.string().optional(),
  photoUrl: z.string().url().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

// POST /api/concerns — public, no auth, rate-limited per IP.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`concerns:${ip}`, 10, 5 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  const parsed = createConcernSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid concern payload" }, { status: 400 });
  }

  const concern = await prisma.concern.create({
    data: { ...parsed.data, status: "QUEUED" },
  });

  return NextResponse.json({ concernId: concern.id, status: concern.status }, { status: 201 });
}

// GET /api/concerns — admin queue view.
export async function GET(req: NextRequest) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get("status");
  const categoryParam = req.nextUrl.searchParams.get("category");

  const concerns = await prisma.concern.findMany({
    where: {
      ...(statusParam ? { status: statusParam as any } : {}),
      ...(categoryParam ? { category: categoryParam as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ concerns });
}
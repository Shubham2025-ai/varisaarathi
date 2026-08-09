import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { aadhaarHash, generateQrToken } from "@/lib/hash";

const registerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  dindiId: z.string(),
  dob: z.string(), // ISO date string
  gender: z.string(),
  bloodGroup: z.string().optional(),
  address: z.string().min(1),
  aadhaarRaw: z.string().min(4),
  healthScreening: z.object({
    hypertension: z.boolean(),
    diabetes: z.boolean(),
    asthma: z.boolean(),
    other: z.string().nullable().optional(),
  }),
});

// Risk badge rules — placeholder thresholds, confirm with team before a
// real deployment (flagged as an open question in the PRD).
function computeRiskBadge(dob: string, screening: { hypertension: boolean; diabetes: boolean; asthma: boolean }) {
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const hasCondition = screening.hypertension || screening.diabetes || screening.asthma;

  if (age >= 65 && (screening.hypertension || screening.diabetes)) return "RED";
  if (age >= 60 || hasCondition) return "AMBER";
  return "GREEN";
}

// Staff-operated registration (Dindi staff registers pilgrims on their
// behalf) — requires a staff login, not open to the public.
export async function POST(req: NextRequest) {
  const session = await requireRole(["VOLUNTEER", "DOCTOR", "DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, dindiId, dob, gender, bloodGroup, address, aadhaarRaw, healthScreening } = parsed.data;

  // Hash immediately, never persist or log the raw value.
  const hashedAadhaar = aadhaarHash(aadhaarRaw);

  const existing = await prisma.warkariProfile.findUnique({ where: { aadhaarHash: hashedAadhaar } });
  if (existing) {
    return NextResponse.json({ error: "Already registered under this Aadhaar.", warkariId: existing.id }, { status: 409 });
  }

  const riskBadge = computeRiskBadge(dob, healthScreening);
  const qrCode = generateQrToken();

  const warkari = await prisma.warkariProfile.create({
    data: {
      name,
      phone,
      dindiId,
      dob: new Date(dob),
      gender,
      bloodGroup,
      address,
      aadhaarHash: hashedAadhaar,
      riskBadge,
      healthSummary: healthScreening,
      qrCode,
    },
  });

  return NextResponse.json({ warkariId: warkari.id, qrCode: warkari.qrCode, riskBadge: warkari.riskBadge }, { status: 201 });
}
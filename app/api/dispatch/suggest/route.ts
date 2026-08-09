import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { scoreAndRankCandidates, type Candidate } from "@/lib/dispatch-scoring";
import Groq from "groq-sdk";

const bodySchema = z.object({ alertId: z.string() });

// AI is advisory-only: it justifies the #1 rule-based pick in plain
// language, it never re-ranks. If Groq is slow or unavailable, the
// rule-based ranking is returned with a generic reason instead of blocking
// the dispatcher — this fallback path is not optional, it's the whole
// point of keeping ranking and justification as separate concerns.
async function getGroqJustification(candidateName: string, distanceMeters: number, alertType: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const completion = await groq.chat.completions.create(
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You write one short factual sentence justifying an already-chosen top-ranked emergency responder. Never suggest a different responder than the one given. Keep it under 20 words. No preamble.",
          },
          {
            role: "user",
            content: `Top pick: ${candidateName}, ${Math.round(distanceMeters)}m away, for a ${alertType} alert. Justify this pick in one sentence.`,
          },
        ],
      },
      { signal: controller.signal as any }
    );
    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null; // timeout or API error — fall back silently, ranking still stands
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const session = await requireRole(["DISPATCHER", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "alertId required" }, { status: 400 });

  const alert = await prisma.alert.findUnique({ where: { id: parsed.data.alertId } });
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  if (alert.latitude == null || alert.longitude == null) {
    return NextResponse.json({ error: "Alert has no location — cannot rank by distance" }, { status: 422 });
  }

  const camps = await prisma.camp.findMany({ where: { active: true } });

  const busyResponderIds = new Set(
    (
      await prisma.alert.findMany({
        where: { status: { in: ["RESPONDER_ASSIGNED", "EN_ROUTE"] } },
        select: { assignedResponderId: true },
      })
    )
      .map((a) => a.assignedResponderId)
      .filter(Boolean)
  );

  const candidates: Candidate[] = camps.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    latitude: c.latitude,
    longitude: c.longitude,
    active: c.active,
    currentlyAssigned: busyResponderIds.has(c.id),
  }));

  const ranked = scoreAndRankCandidates(alert.type, alert.latitude, alert.longitude, candidates, 3);

  const top = ranked[0];
  const reason = top ? await getGroqJustification(top.name, top.distanceMeters, alert.type) : null;

  const suggestions = ranked.map((c, i) => ({
    responderId: c.id,
    name: c.name,
    distanceMeters: Math.round(c.distanceMeters),
    score: Number(c.score.toFixed(3)),
    reason: i === 0 ? reason ?? `Closest available match (${Math.round(c.distanceMeters)}m away).` : null,
  }));

  await prisma.alert.update({
    where: { id: alert.id },
    data: { aiSuggestion: { candidates: suggestions } },
  });

  return NextResponse.json({ suggestions });
}
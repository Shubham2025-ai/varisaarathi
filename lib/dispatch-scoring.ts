// Pure, deterministic scoring logic — no DB or network calls, so it stays
// trivially testable. AI (Groq, added later) only ever justifies the #1
// result in plain language — it never re-ranks. This file is what makes
// the "AI suggests, doesn't decide" claim actually true at the code level.

export type AlertTypeValue = "MEDICAL" | "HEAT_RISK" | "SAFETY" | "LOST_ELDERLY" | "THEFT";

export interface Candidate {
  id: string;
  name: string;
  type: "MEDICAL" | "POLICE" | "AMBULANCE_BASE";
  latitude: number;
  longitude: number;
  active: boolean;
  currentlyAssigned: boolean;
}

export interface ScoredCandidate extends Candidate {
  distanceMeters: number;
  score: number;
}

const SEVERITY_MATCH: Record<AlertTypeValue, Candidate["type"][]> = {
  MEDICAL: ["MEDICAL", "AMBULANCE_BASE"],
  HEAT_RISK: ["MEDICAL", "AMBULANCE_BASE"],
  SAFETY: ["POLICE"],
  LOST_ELDERLY: ["POLICE", "MEDICAL"],
  THEFT: ["POLICE"],
};

const WEIGHTS = {
  distance: 0.5,
  availability: 0.3,
  severityMatch: 0.2,
};

/** Haversine distance in meters between two lat/lng points. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function scoreAndRankCandidates(
  alertType: AlertTypeValue,
  alertLat: number,
  alertLon: number,
  candidates: Candidate[],
  maxResults = 3
): ScoredCandidate[] {
  const relevantTypes = SEVERITY_MATCH[alertType];

  const scored = candidates
    .filter((c) => c.active)
    .map((c) => {
      const distanceMeters = haversineMeters(alertLat, alertLon, c.latitude, c.longitude);
      const distanceScore = 1 / (1 + distanceMeters / 1000);
      const availabilityScore = c.currentlyAssigned ? 0 : 1;
      const severityScore = relevantTypes.includes(c.type) ? 1 : 0.3;

      const score =
        WEIGHTS.distance * distanceScore +
        WEIGHTS.availability * availabilityScore +
        WEIGHTS.severityMatch * severityScore;

      return { ...c, distanceMeters, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}
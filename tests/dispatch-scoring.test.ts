import { describe, it, expect } from "vitest";
import { haversineMeters, scoreAndRankCandidates, type Candidate } from "../lib/dispatch-scoring";

describe("haversineMeters", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineMeters(18.52, 73.85, 18.52, 73.85)).toBe(0);
  });

  it("returns a known real-world distance within a reasonable margin", () => {
    // Pune (18.5204, 73.8567) to Mumbai (19.0760, 72.8777) — actual distance
    // is roughly 119km. Allow a few km of tolerance for the spherical
    // approximation vs. real-world routing.
    const distance = haversineMeters(18.5204, 73.8567, 19.076, 72.8777);
    expect(distance).toBeGreaterThan(110000);
    expect(distance).toBeLessThan(130000);
  });

  it("is symmetric — distance A→B equals distance B→A", () => {
    const ab = haversineMeters(18.34, 74.02, 18.28, 74.16);
    const ba = haversineMeters(18.28, 74.16, 18.34, 74.02);
    expect(ab).toBeCloseTo(ba, 5);
  });
});

describe("scoreAndRankCandidates", () => {
  const alertLat = 18.34;
  const alertLon = 74.02;

  function makeCandidate(overrides: Partial<Candidate>): Candidate {
    return {
      id: "c1",
      name: "Test Camp",
      type: "MEDICAL",
      latitude: 18.34,
      longitude: 74.02,
      active: true,
      currentlyAssigned: false,
      ...overrides,
    };
  }

  it("filters out inactive candidates entirely", () => {
    const candidates = [
      makeCandidate({ id: "active", active: true }),
      makeCandidate({ id: "inactive", active: false }),
    ];
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, candidates);
    expect(ranked.find((c) => c.id === "inactive")).toBeUndefined();
    expect(ranked.find((c) => c.id === "active")).toBeDefined();
  });

  it("ranks a closer candidate above a farther one, all else equal", () => {
    const near = makeCandidate({ id: "near", latitude: 18.341, longitude: 74.021 });
    const far = makeCandidate({ id: "far", latitude: 19.0, longitude: 75.0 });
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, [far, near]);
    expect(ranked[0].id).toBe("near");
  });

  it("ranks an available candidate above a busy one at equal distance", () => {
    const free = makeCandidate({ id: "free", currentlyAssigned: false });
    const busy = makeCandidate({ id: "busy", currentlyAssigned: true });
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, [busy, free]);
    expect(ranked[0].id).toBe("free");
  });

  it("prefers a farther-but-free candidate over a closer-but-busy one, matching the observed real-world case", () => {
    // Mirrors the actual manual test result: Camp Charlie (~5km, busy) was
    // outranked by Camp Delta (~8.6km, free). At this distance scale the
    // 0.3-weighted availability gap outweighs the 0.5-weighted distance
    // gap, because the distance SCORE difference (1/(1+d/1000)) shrinks
    // fast once both candidates are already several km away — the two
    // camps are close to equally "far" in scoring terms, so availability
    // decides it. This does NOT hold at extreme distance gaps (see the
    // simpler "ranks a closer candidate above a farther one" test above),
    // which is why this test uses realistic, moderate distances rather
    // than an exaggerated one.
    const closeButBusy = makeCandidate({ id: "close-busy", latitude: 18.386, longitude: 74.02, currentlyAssigned: true }); // ~5.1km
    const farButFree = makeCandidate({ id: "far-free", latitude: 18.42, longitude: 74.02, currentlyAssigned: false }); // ~8.9km
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, [closeButBusy, farButFree]);
    expect(ranked[0].id).toBe("far-free");
  });

  it("scores a type-matched candidate higher than a mismatched one at equal distance/availability", () => {
    const matched = makeCandidate({ id: "police", type: "POLICE" });
    const mismatched = makeCandidate({ id: "medical-for-theft", type: "MEDICAL" });
    // THEFT alerts should prefer POLICE per SEVERITY_MATCH
    const ranked = scoreAndRankCandidates("THEFT", alertLat, alertLon, [mismatched, matched]);
    expect(ranked[0].id).toBe("police");
  });

  it("respects the maxResults limit", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ id: `c${i}`, latitude: 18.34 + i * 0.01 })
    );
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, candidates, 3);
    expect(ranked.length).toBe(3);
  });

  it("returns an empty array when given no candidates", () => {
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, []);
    expect(ranked).toEqual([]);
  });

  it("returns an empty array when all candidates are inactive", () => {
    const candidates = [makeCandidate({ active: false }), makeCandidate({ id: "c2", active: false })];
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, candidates);
    expect(ranked).toEqual([]);
  });

  it("every returned candidate includes a numeric distanceMeters and score", () => {
    const candidates = [makeCandidate({})];
    const ranked = scoreAndRankCandidates("MEDICAL", alertLat, alertLon, candidates);
    expect(typeof ranked[0].distanceMeters).toBe("number");
    expect(typeof ranked[0].score).toBe("number");
  });
});
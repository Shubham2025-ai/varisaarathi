import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCurrentWeather } from "@/lib/openweather";
import { calculateHeatIndexF, celsiusToFahrenheit, fahrenheitToCelsius, heatIndexLevel } from "@/lib/heat-index";

// Route segments matched to real coordinates along a plausible Wari route.
// Replace/extend with actual route waypoints for a real deployment.
const ROUTE_SEGMENTS = [
  { name: "Pune-Saswad", latitude: 18.34, longitude: 74.02 },
  { name: "Saswad-Jejuri", latitude: 18.28, longitude: 74.16 },
];

const ADVISORY_TEXT: Record<string, { en: string; mr: string }> = {
  LOW: {
    en: "Weather is mild today. Stay hydrated as usual.",
    mr: "आजचे हवामान सौम्य आहे. नेहमीप्रमाणे पाणी पीत रहा.",
  },
  MODERATE: {
    en: "Moderate heat expected. Drink water regularly and take rest breaks in shade.",
    mr: "मध्यम उष्णता अपेक्षित आहे. नियमितपणे पाणी प्या आणि सावलीत विश्रांती घ्या.",
  },
  HIGH: {
    en: "High heat risk today. Avoid walking during peak afternoon hours, hydrate frequently.",
    mr: "आज उष्णतेचा उच्च धोका आहे. दुपारच्या वेळी चालणे टाळा, वारंवार पाणी प्या.",
  },
  EXTREME: {
    en: "Extreme heat warning. Seek shade immediately if feeling unwell, use SOS if needed.",
    mr: "अत्यंत उष्णतेचा इशारा. अस्वस्थ वाटल्यास त्वरित सावली शोधा, आवश्यक असल्यास SOS वापरा.",
  },
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];

  for (const segment of ROUTE_SEGMENTS) {
    try {
      const { tempC, humidity } = await fetchCurrentWeather(segment.latitude, segment.longitude);
      const heatIndexF = calculateHeatIndexF(celsiusToFahrenheit(tempC), humidity);
      const heatIndexC = fahrenheitToCelsius(heatIndexF);
      const level = heatIndexLevel(heatIndexC);
      const text = ADVISORY_TEXT[level];

      const advisory = await prisma.heatAdvisory.create({
        data: {
          routeSegment: segment.name,
          heatIndex: Number(heatIndexC.toFixed(1)),
          advisoryTextEn: text.en,
          advisoryTextMr: text.mr,
        },
      });

      results.push({ segment: segment.name, level, heatIndexC: advisory.heatIndex });
    } catch (e) {
      results.push({ segment: segment.name, error: e instanceof Error ? e.message : "failed" });
    }
  }

  return NextResponse.json({ results });
}
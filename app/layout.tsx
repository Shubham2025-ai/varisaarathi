import type { Metadata } from "next";
import { Baloo_2, Hind, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Typography: Baloo 2 = display (headlines, SOS label) — used sparingly
// Hind = body, bilingual EN/Marathi legibility
// IBM Plex Mono = utility/data (timestamps, coordinates, alert IDs)
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo", weight: ["600", "700"] });
const hind = Hind({ subsets: ["latin", "devanagari"], variable: "--font-hind", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "VariSaarathi",
  description: "Real-time SOS and emergency response for Warkari pilgrims.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${hind.variable} ${plexMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
"use client";

import { QRCodeSVG } from "qrcode.react";
import { LanternBadge } from "./lantern-badge";

type RiskLevel = "GREEN" | "AMBER" | "RED";

export interface IdCardProps {
  name: string;
  dindiName: string;
  bloodGroup: string | null;
  riskBadge: RiskLevel;
  qrCode: string;
}

export function IdCard({ name, dindiName, bloodGroup, riskBadge, qrCode }: IdCardProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col sm:flex-row gap-4 print:flex-row" id="id-card-print-area">
        {/* FRONT */}
        <div className="w-72 h-44 rounded-2xl bg-surface-raised border border-black/10 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-accent-saffron text-sm">VARISAARATHI</span>
            <LanternBadge level={riskBadge} showLabel={false} size={16} />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center text-accent-indigo font-display font-bold text-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-body font-semibold text-sm">{name}</p>
              <p className="text-xs text-text-primary/60">{dindiName}</p>
              <p className="text-xs text-text-primary/60">Blood group: {bloodGroup ?? "—"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <LanternBadge level={riskBadge} showLabel={true} size={14} />
          </div>
        </div>

        {/* BACK */}
        <div className="w-72 h-44 rounded-2xl bg-surface-raised border border-black/10 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-lg border">
            <QRCodeSVG value={qrCode} size={100} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-primary/70 leading-snug">
              This card belongs to Dindi Organization. Scan for health record (authorized personnel only).
            </p>
            <p className="text-xs text-text-primary/50 leading-snug mt-2">
              Aadhaar used only for verification. Not stored.
            </p>
            <p className="text-xs text-text-primary/50 leading-snug mt-1">
              Badge shows risk tier only, never the specific condition.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="print:hidden px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-semibold"
      >
        Print ID Card
      </button>

      {/* Print-specific rules: hide everything on the page except the card
          itself when printing, per Design Brief's card-as-physical-artifact
          intent. */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-print-area,
          #id-card-print-area * {
            visibility: visible;
          }
          #id-card-print-area {
            position: absolute;
            top: 0;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}
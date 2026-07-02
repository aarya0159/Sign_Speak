"use client";

import { BONE_CONNECTIONS, Point, buildSyntheticLandmarks, hashString } from "@/lib/handPose";

interface HandVisionPanelProps {
  word: string;
  visualCue: string;
  index: number;
  total: number;
  description?: string;
  /** Real camera-tracked landmarks (21 points, normalized 0-1). Overrides the synthetic pose. */
  liveLandmarks?: Point[] | null;
  trackingStatus?: "active" | "searching";
}

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 260;

function scaleLiveLandmarks(liveLandmarks: Point[]): Point[] {
  return liveLandmarks.map((point) => ({
    x: point.x * VIEW_WIDTH,
    y: point.y * VIEW_HEIGHT,
  }));
}

export default function HandVisionPanel({
  word,
  visualCue,
  index,
  total,
  description,
  liveLandmarks,
  trackingStatus = "active",
}: HandVisionPanelProps) {
  const landmarks = liveLandmarks && liveLandmarks.length === 21
    ? scaleLiveLandmarks(liveLandmarks)
    : buildSyntheticLandmarks(word, description);
  const confidence = (0.86 + (hashString(word) % 12) / 100).toFixed(2);
  const isTracking = trackingStatus === "active";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-muted/30 bg-[#160F26] p-5 text-purple-muted shadow-inner">
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-purple-muted/80">
        <span>3D Mesh Vector View</span>
        <span className={`flex items-center gap-1 ${isTracking ? "text-[#8DE7B8]" : "text-amber-300"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isTracking ? "bg-[#8DE7B8]" : "bg-amber-300"}`} />
          {isTracking ? "Tracking Active" : "Searching..."}
        </span>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-[#0F0A1D]">
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-64 w-full">
          <defs>
            <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#7C5CBF" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#grid)" />

          {BONE_CONNECTIONS.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={landmarks[a].x}
              y1={landmarks[a].y}
              x2={landmarks[b].x}
              y2={landmarks[b].y}
              stroke="#B49DDF"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}

          {landmarks.map((point, i) => (
            <g key={i}>
              <circle cx={point.x} cy={point.y} r={i === 0 ? 6 : 4} fill="#0F0A1D" stroke="#B49DDF" strokeWidth={1.5} />
              <circle cx={point.x} cy={point.y} r={i === 0 ? 2.5 : 1.5} fill="#EDE6F8" />
            </g>
          ))}
        </svg>

        <div className="scan-line pointer-events-none absolute inset-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono text-purple-muted/70">
        <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          NODES <span className="text-white">21/21</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          CONF <span className="text-white">{confidence}</span>
        </div>
        <div className="col-span-2 rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          VECTOR TAG <span className="text-white">{visualCue}</span>
        </div>
        <div className="col-span-2 rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          FRAME <span className="text-white">{index + 1} / {total}</span>
        </div>
      </div>

      <style jsx>{`
        .scan-line::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #b49ddf, transparent);
          animation: scan 2.4s linear infinite;
        }
        @keyframes scan {
          0% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
}

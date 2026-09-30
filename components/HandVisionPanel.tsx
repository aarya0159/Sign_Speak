"use client";

import { useEffect, useRef, useState } from "react";
import { BONE_CONNECTIONS, Point } from "@/lib/handPose";
import { AnimFrame, PoseStreamSample, poseStreamAt } from "@/lib/handShapes";

interface HandVisionPanelProps {
  /** Headline word or phrase being shown */
  label: string;
  /** Sign sequence rendered as a continuous interpolated pose stream */
  frames?: AnimFrame[];
  /** Real camera-tracked landmarks (21 points, normalized 0-1). Overrides playback. */
  liveLandmarks?: Point[] | null;
  trackingStatus?: "active" | "searching";
  visualCue?: string;
  index?: number;
  total?: number;
}

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 260;

export default function HandVisionPanel({
  label,
  frames,
  liveLandmarks,
  trackingStatus = "active",
  visualCue,
  index,
  total,
}: HandVisionPanelProps) {
  const [sample, setSample] = useState<PoseStreamSample>(() => poseStreamAt(undefined, 0));
  const [fps, setFps] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const framesRef = useRef<AnimFrame[] | undefined>(frames);
  framesRef.current = frames;
  const frameTimestampsRef = useRef<number[]>([]);

  const isLive = Boolean(liveLandmarks && liveLandmarks.length === 21);

  // Track real update timestamps so the on-screen fps reflects what's
  // actually rendering, in both pose-stream and live-camera modes.
  function recordFrameTimestamp() {
    const now = performance.now();
    const timestamps = frameTimestampsRef.current;
    timestamps.push(now);
    while (timestamps.length > 0 && now - timestamps[0] > 1000) timestamps.shift();
    if (timestamps.length >= 2) {
      const elapsedSeconds = (now - timestamps[0]) / 1000;
      setFps(Math.round((timestamps.length - 1) / elapsedSeconds));
    }
  }

  useEffect(() => {
    if (isLive) return; // live camera mode drives the skeleton directly

    let start: number | null = null;

    function tick(now: number) {
      if (start === null) start = now;
      // Sample the continuous pose stream at this frame's timestamp — the
      // stream interpolates every joint coordinate, so playback stays fluid
      // regardless of how many signs the sequence chains together.
      setSample(poseStreamAt(framesRef.current, now - start));
      recordFrameTimestamp();
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;
    recordFrameTimestamp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, liveLandmarks]);

  const landmarks = isLive
    ? liveLandmarks!.map((p) => ({ x: p.x * VIEW_WIDTH, y: p.y * VIEW_HEIGHT }))
    : sample.points;

  const isTracking = trackingStatus === "active";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-apricot/30 bg-[#2B1810] p-5 text-apricot shadow-warm">
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-apricot/80">
        <span>3D Mesh Vector View</span>
        <span className={`flex items-center gap-1 ${isTracking ? "text-[#8DE7B8]" : "text-honey"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isTracking ? "bg-[#8DE7B8]" : "bg-honey"} animate-pulse`} />
          {isTracking ? "Tracking Active" : "Searching..."}
        </span>
      </div>

      <div className="relative rounded-2xl border border-white/5 bg-[#1E0F09]">
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-64 w-full">
          <defs>
            <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#E96F4C" strokeOpacity="0.1" strokeWidth="1" />
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
              stroke="#F4A97F"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}

          {landmarks.map((point, i) => (
            <g key={i}>
              <circle cx={point.x} cy={point.y} r={i === 0 ? 6 : 4} fill="#1E0F09" stroke="#F4A97F" strokeWidth={1.5} />
              <circle cx={point.x} cy={point.y} r={i === 0 ? 2.5 : 1.5} fill="#FFE4D0" />
            </g>
          ))}
        </svg>

        {sample.label && !isLive && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold tracking-wide text-peach backdrop-blur-sm">
            {sample.label}
            {sample.frameCount > 1 && (
              <span className="ml-2 text-apricot/70">
                {sample.frameIndex + 1}/{sample.frameCount}
              </span>
            )}
          </div>
        )}

        <div className="scan-line pointer-events-none absolute inset-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono text-apricot/70">
        <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          NODES <span className="text-white">21/21</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          MODE <span className="text-white">{isLive ? "LIVE CAM" : "POSE STREAM"}</span>
        </div>
        <div className="col-span-2 truncate rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          SIGN <span className="text-white">{label}</span>
        </div>
        <div className="col-span-2 truncate rounded-lg border border-white/5 bg-white/5 px-2 py-1">
          PIPELINE{" "}
          <span className="text-white">
            gloss-free · continuous coordinates{fps !== null ? ` · ${fps} fps` : ""}
          </span>
        </div>
        {visualCue && (
          <div className="col-span-2 truncate rounded-lg border border-white/5 bg-white/5 px-2 py-1">
            VECTOR TAG <span className="text-white">{visualCue}</span>
          </div>
        )}
        {typeof index === "number" && typeof total === "number" && total > 1 && (
          <div className="col-span-2 rounded-lg border border-white/5 bg-white/5 px-2 py-1">
            FRAME <span className="text-white">{index + 1} / {total}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .scan-line::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f6a83c, transparent);
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

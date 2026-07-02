"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import HandVisionPanel from "@/components/HandVisionPanel";
import { Point } from "@/lib/handPose";
import { Point3D, SignMatch, extendedVectorFromLandmarks, matchSign } from "@/lib/signRecognizer";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const CONFIDENCE_THRESHOLD = 0.6; // at least 3 of 5 fingers must agree
const STABLE_FRAMES_TO_COMMIT = 6;
const DETECTION_INTERVAL_MS = 120;

type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";
type ModelStatus = "loading" | "ready" | "error";

export default function SignToTextTab() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef(0);
  const lastCandidateRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const lastCommittedRef = useRef<string | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const [liveLandmarks, setLiveLandmarks] = useState<Point[] | null>(null);
  const [match, setMatch] = useState<SignMatch | null>(null);
  const [outputText, setOutputText] = useState("");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    function detectLoop(timestamp: number) {
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (
        video &&
        handLandmarker &&
        video.readyState >= 2 &&
        timestamp - lastDetectionTimeRef.current > DETECTION_INTERVAL_MS
      ) {
        lastDetectionTimeRef.current = timestamp;
        const result = handLandmarker.detectForVideo(video, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          const rawLandmarks = result.landmarks[0] as Point3D[];
          const mirrored: Point[] = rawLandmarks.map((point) => ({ x: 1 - point.x, y: point.y }));
          setLiveLandmarks(mirrored);

          const extended = extendedVectorFromLandmarks(rawLandmarks);
          const candidate = matchSign(extended);
          const isConfident = candidate.confidence >= CONFIDENCE_THRESHOLD;
          setMatch(isConfident ? candidate : null);

          if (isConfident) {
            if (lastCandidateRef.current === candidate.word) {
              stableCountRef.current += 1;
            } else {
              lastCandidateRef.current = candidate.word;
              stableCountRef.current = 1;
            }

            if (
              stableCountRef.current === STABLE_FRAMES_TO_COMMIT &&
              lastCommittedRef.current !== candidate.word
            ) {
              lastCommittedRef.current = candidate.word;
              setOutputText((prev) => `${prev}${candidate.word}`);
            }
          } else {
            lastCandidateRef.current = null;
            stableCountRef.current = 0;
          }
        } else {
          setLiveLandmarks(null);
          setMatch(null);
          lastCandidateRef.current = null;
          stableCountRef.current = 0;
          lastCommittedRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    }

    async function setup() {
      setCameraStatus("requesting");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraStatus("granted");
      } catch (error) {
        setCameraStatus(
          error instanceof DOMException && error.name === "NotFoundError" ? "unavailable" : "denied",
        );
        return;
      }

      try {
        const tasksVision = await import("@mediapipe/tasks-vision");
        const fileset = await tasksVision.FilesetResolver.forVisionTasks(WASM_URL);
        const handLandmarker = await tasksVision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (cancelled) {
          handLandmarker.close();
          return;
        }
        handLandmarkerRef.current = handLandmarker;
        setModelStatus("ready");
        rafRef.current = requestAnimationFrame(detectLoop);
      } catch {
        setModelStatus("error");
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setModelStatus("error");
    } else {
      setup();
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((track) => track.stop());
      handLandmarkerRef.current?.close();
    };
  }, []);

  function clearOutput() {
    setOutputText("");
    lastCommittedRef.current = null;
  }

  function speakOutput() {
    if (!outputText || typeof window.speechSynthesis === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(outputText.split("").join(" "));
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-espresso">Sign → Text</h1>
        <p className="mt-1 text-muted">
          Your camera turns on automatically and reads your hand shape in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-bold text-espresso/80">Camera / video</p>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-espresso/10 bg-espresso/5">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full origin-center scale-x-[-1] object-cover"
            />

            {cameraStatus !== "granted" && (
              <div className="absolute inset-0 flex items-center justify-center bg-cream/95 px-6 text-center">
                {cameraStatus === "idle" || cameraStatus === "requesting" ? (
                  <p className="font-bold text-espresso/70">Requesting camera access...</p>
                ) : cameraStatus === "denied" ? (
                  <div>
                    <p className="font-bold text-red-600">Camera access denied</p>
                    <p className="mt-1 text-sm text-muted">
                      Enable camera permissions for this site in your browser settings, then reload the page.
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-red-600">No camera was found on this device.</p>
                )}
              </div>
            )}

            {cameraStatus === "granted" && modelStatus === "loading" && (
              <div className="absolute inset-x-0 bottom-0 bg-espresso/70 px-4 py-2 text-center text-xs font-bold text-white">
                Loading hand-tracking model...
              </div>
            )}
            {modelStatus === "error" && (
              <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-4 py-2 text-center text-xs font-bold text-white">
                Couldn&apos;t load the hand-tracking model. Check your connection and reload.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-espresso/10 bg-white/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-espresso/80">Text output</p>
              <button
                type="button"
                onClick={clearOutput}
                className="text-xs font-bold text-purple hover:underline"
              >
                Clear
              </button>
            </div>
            <p className="mt-1 min-h-[2rem] text-lg font-extrabold tracking-wide text-espresso">
              {outputText || "…"}
            </p>
            <button
              type="button"
              onClick={speakOutput}
              disabled={!outputText}
              className="mt-2 rounded-xl bg-purple px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Speak Output
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-espresso/80">AI detection · pose + gesture</p>
          <HandVisionPanel
            word={match?.word ?? "SEARCHING"}
            visualCue={
              match
                ? `Matched "${match.word}" · ${Math.round(match.confidence * 100)}% finger agreement`
                : "No hand detected in frame"
            }
            description={match?.description}
            liveLandmarks={liveLandmarks}
            trackingStatus={liveLandmarks ? "active" : "searching"}
            index={0}
            total={1}
          />
          <p className="text-xs text-muted">
            Live hand pose is compared against the 26-letter manual alphabet database. Motion-based
            signs (like J, Z, or full phrases) can&apos;t be matched from a single frame.
          </p>
        </div>
      </div>
    </div>
  );
}

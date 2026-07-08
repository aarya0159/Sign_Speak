"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import HandVisionPanel from "@/components/HandVisionPanel";
import { Point } from "@/lib/handPose";
import { DecoderState, GlossFreeDecoder } from "@/lib/glossFreeDecoder";
import {
  DetectedMotion,
  Point3D,
  WristSample,
  classifyMotion,
  extendedVectorFromLandmarks,
  scoreCandidates,
} from "@/lib/signRecognizer";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const DETECTION_INTERVAL_MS = 120;

type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";
type ModelStatus = "loading" | "ready" | "error";

const EMPTY_STREAM: DecoderState = { committedText: "", hypothesis: null, predictions: [] };

export default function SignToTextTab() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef(0);
  const wristHistoryRef = useRef<WristSample[]>([]);
  const decoderRef = useRef<GlossFreeDecoder>(new GlossFreeDecoder());

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const [liveLandmarks, setLiveLandmarks] = useState<Point[] | null>(null);
  const [stream, setStream] = useState<DecoderState>(EMPTY_STREAM);
  const [motion, setMotion] = useState<DetectedMotion>("still");

  useEffect(() => {
    let cancelled = false;
    let mediaStream: MediaStream | null = null;

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

          const wrist = rawLandmarks[0];
          wristHistoryRef.current.push({ x: wrist.x, y: wrist.y, t: performance.now() });
          if (wristHistoryRef.current.length > 24) wristHistoryRef.current.shift();
          const detectedMotion = classifyMotion(wristHistoryRef.current);
          setMotion(detectedMotion);

          // Gloss-free path: every frame emits a ranked hypothesis array from
          // the landmark-sequence scorer; the streaming decoder integrates the
          // evidence over time into a continuously evolving sentence.
          const candidates = scoreCandidates(
            extendedVectorFromLandmarks(rawLandmarks),
            wrist?.y,
            detectedMotion,
          );
          setStream(decoderRef.current.update(candidates));
        } else {
          setLiveLandmarks(null);
          setMotion("still");
          wristHistoryRef.current = [];
          setStream(decoderRef.current.handLost());
        }
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    }

    async function setup() {
      setCameraStatus("requesting");
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
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
      mediaStream?.getTracks().forEach((track) => track.stop());
      handLandmarkerRef.current?.close();
    };
  }, []);

  function clearOutput() {
    setStream(decoderRef.current.clear());
  }

  function speakOutput() {
    const trimmed = stream.committedText.trim();
    if (!trimmed || typeof window.speechSynthesis === "undefined") return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(trimmed));
  }

  const topPrediction = stream.predictions[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Sign <span className="text-sunset">→</span> Text
        </h1>
        <p className="mt-1 text-muted">
          Continuous gloss-free decoding — your signing streams into a sentence as you move, no
          stop-and-pose required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-bold text-espresso/80">Camera / video</p>
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-espresso/10 bg-espresso/5 shadow-warm-sm">
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
                    <p className="font-bold text-rose">Camera access denied</p>
                    <p className="mt-1 text-sm text-muted">
                      Enable camera permissions for this site in your browser settings, then reload the page.
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-rose">No camera was found on this device.</p>
                )}
              </div>
            )}

            {cameraStatus === "granted" && modelStatus === "loading" && (
              <div className="absolute inset-x-0 bottom-0 bg-espresso/70 px-4 py-2 text-center text-xs font-bold text-white">
                Loading hand-tracking model...
              </div>
            )}
            {modelStatus === "error" && (
              <div className="absolute inset-x-0 bottom-0 bg-rose/90 px-4 py-2 text-center text-xs font-bold text-white">
                Couldn&apos;t load the hand-tracking model. Check your connection and reload.
              </div>
            )}
          </div>

          <div className="card-warm p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-espresso/80">Live translation stream</p>
              <button
                type="button"
                onClick={clearOutput}
                className="text-xs font-bold text-coral hover:underline"
              >
                Clear
              </button>
            </div>
            <p className="mt-2 min-h-[2.5rem] text-lg font-extrabold leading-relaxed tracking-wide text-espresso">
              {stream.committedText}
              {stream.hypothesis && (
                <span className="ml-1.5 animate-pulse text-apricot">
                  {stream.hypothesis.word}
                </span>
              )}
              {!stream.committedText && !stream.hypothesis && (
                <span className="text-muted/60">Start signing to stream a sentence…</span>
              )}
              <span className="ml-0.5 inline-block h-5 w-[3px] animate-pulse rounded-full bg-coral align-middle" />
            </p>
            <button
              type="button"
              onClick={speakOutput}
              disabled={!stream.committedText.trim()}
              className="btn-sunset mt-2 px-4 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Speak Output
            </button>
          </div>

          <div className="card-warm p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-espresso/80">Prediction stream · top hypotheses</p>
              <span className="chip-warm">motion: {motion}</span>
            </div>
            <div className="mt-3 space-y-2">
              {stream.predictions.length === 0 && (
                <p className="text-xs text-muted">No hand in frame — the belief state is idle.</p>
              )}
              {stream.predictions.map((prediction) => (
                <div key={prediction.word} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs font-bold text-espresso">
                    {prediction.word}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-espresso/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral to-honey transition-all duration-200"
                      style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted">
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-espresso/80">AI detection · landmark sequence</p>
          <HandVisionPanel
            label={topPrediction?.word ?? "Searching..."}
            visualCue={
              topPrediction
                ? `Streaming belief · ${Math.round(topPrediction.confidence * 100)}% · motion: ${motion}`
                : "No hand detected in frame"
            }
            liveLandmarks={liveLandmarks}
            trackingStatus={liveLandmarks ? "active" : "searching"}
          />
          <p className="text-xs text-muted">
            Gloss-free pipeline: raw MediaPipe landmark sequences stream into a per-frame hypothesis
            array, and a temporal decoder integrates the evidence into a continuously evolving
            sentence — signs are never frozen into isolated flashcard tokens. The current scorer is
            geometric (handshape + location + motion over 14 signs and 26 letters); it&apos;s
            architected so a trained sequence encoder (ViT + CTC) can drop in as the scorer without
            changing the decoder or this UI.
          </p>
        </div>
      </div>
    </div>
  );
}

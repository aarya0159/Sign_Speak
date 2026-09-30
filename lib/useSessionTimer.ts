import { useEffect, useRef } from "react";
import { addTimeSpentMinutes } from "@/lib/stats";

const FLUSH_INTERVAL_MS = 60000;

/** Tracks time spent on the page and periodically persists it to signspeak_stats. */
export function useSessionTimer(): void {
  const lastFlushRef = useRef(Date.now());

  useEffect(() => {
    function flush() {
      const now = Date.now();
      const minutes = Math.round((now - lastFlushRef.current) / 60000);
      if (minutes > 0) {
        addTimeSpentMinutes(minutes);
        lastFlushRef.current = now;
      }
    }

    const interval = setInterval(flush, FLUSH_INTERVAL_MS);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);

    return () => {
      flush();
      clearInterval(interval);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, []);
}

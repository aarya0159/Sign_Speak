const STATS_KEY = "signspeak_stats";
const MAX_TRACKED_DAYS = 120;

export interface DashboardStats {
  streak: number;
  studiedThisWeek: number;
  timeSpentMinutes: number;
  lessonsCompleted: number;
}

interface StoredStats {
  activeDates: string[];
  lessonsCompleted: number;
  timeSpentMinutes: number;
}

const EMPTY_STATS: StoredStats = {
  activeDates: [],
  lessonsCompleted: 0,
  timeSpentMinutes: 0,
};

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((Date.parse(a) - Date.parse(b)) / msPerDay);
}

function loadStored(): StoredStats {
  if (typeof window === "undefined") return { ...EMPTY_STATS };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...EMPTY_STATS };
    const parsed = JSON.parse(raw);
    return {
      activeDates: Array.isArray(parsed.activeDates) ? parsed.activeDates : [],
      lessonsCompleted: typeof parsed.lessonsCompleted === "number" ? parsed.lessonsCompleted : 0,
      timeSpentMinutes: typeof parsed.timeSpentMinutes === "number" ? parsed.timeSpentMinutes : 0,
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function saveStored(stats: StoredStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function computeStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;
  const sorted = Array.from(new Set(activeDates)).sort().reverse();
  const today = todayIso();
  const mostRecentGap = daysBetween(today, sorted[0]);
  if (mostRecentGap > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap === 1) {
      streak++;
    } else if (gap > 1) {
      break;
    }
  }
  return streak;
}

function computeStudiedThisWeek(activeDates: string[]): number {
  const today = todayIso();
  const unique = new Set(activeDates);
  let count = 0;
  unique.forEach((date) => {
    const gap = daysBetween(today, date);
    if (gap >= 0 && gap < 7) count++;
  });
  return count;
}

function toDashboardStats(stored: StoredStats): DashboardStats {
  return {
    streak: computeStreak(stored.activeDates),
    studiedThisWeek: computeStudiedThisWeek(stored.activeDates),
    timeSpentMinutes: stored.timeSpentMinutes,
    lessonsCompleted: stored.lessonsCompleted,
  };
}

export function getDashboardStats(): DashboardStats {
  return toDashboardStats(loadStored());
}

/** Marks today as an active study day. Call on visits to dashboard/lessons/tutor. */
export function recordActivity(): DashboardStats {
  const stored = loadStored();
  const today = todayIso();
  if (!stored.activeDates.includes(today)) {
    stored.activeDates = [...stored.activeDates, today].slice(-MAX_TRACKED_DAYS);
    saveStored(stored);
  }
  return toDashboardStats(stored);
}

export function incrementLessonsCompleted(): DashboardStats {
  const stored = loadStored();
  stored.lessonsCompleted += 1;
  saveStored(stored);
  return toDashboardStats(stored);
}

export function addTimeSpentMinutes(minutes: number): DashboardStats {
  if (minutes <= 0) return getDashboardStats();
  const stored = loadStored();
  stored.timeSpentMinutes += minutes;
  saveStored(stored);
  return toDashboardStats(stored);
}

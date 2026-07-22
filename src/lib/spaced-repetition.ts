import type { CardProgress, ReviewRating } from '$lib/types';

export interface ReviewSchedule {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: string;
  lastReviewedAt: string;
}

const DAY_MS = 86_400_000;

export function scheduleReview(
  progress: CardProgress | null,
  rating: ReviewRating,
  now = new Date()
): ReviewSchedule {
  const previousRepetitions = progress?.repetitions ?? 0;
  const previousInterval = progress?.intervalDays ?? 0;
  const previousEase = progress?.easeFactor ?? 2.5;

  let repetitions = previousRepetitions + 1;
  let intervalDays = previousInterval;
  let easeFactor = previousEase;
  let dueAt: Date;

  switch (rating) {
    case 'again':
      repetitions = 0;
      intervalDays = 0;
      easeFactor = Math.max(1.3, previousEase - 0.2);
      dueAt = new Date(now.getTime() + 10 * 60 * 1000);
      break;
    case 'hard':
      intervalDays = previousInterval <= 1 ? 1 : Math.max(1, Math.round(previousInterval * 1.2));
      easeFactor = Math.max(1.3, previousEase - 0.15);
      dueAt = new Date(now.getTime() + intervalDays * DAY_MS);
      break;
    case 'good':
      intervalDays = previousRepetitions === 0
        ? 1
        : previousRepetitions === 1
          ? 3
          : Math.max(1, Math.round(previousInterval * previousEase));
      dueAt = new Date(now.getTime() + intervalDays * DAY_MS);
      break;
    case 'easy':
      intervalDays = previousRepetitions === 0
        ? 4
        : previousRepetitions === 1
          ? 7
          : Math.max(1, Math.round(previousInterval * previousEase * 1.3));
      easeFactor = Math.min(3.2, previousEase + 0.15);
      dueAt = new Date(now.getTime() + intervalDays * DAY_MS);
      break;
    default: {
      const exhaustiveRating: never = rating;
      throw new Error(`Unsupported review rating: ${exhaustiveRating}`);
    }
  }

  return {
    repetitions,
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueAt: dueAt.toISOString(),
    lastReviewedAt: now.toISOString()
  };
}

export function isCardDue(progress: CardProgress | null, now = new Date()): boolean {
  return !progress || new Date(progress.dueAt).getTime() <= now.getTime();
}

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * This implements a simplified version of the SuperMemo SM-2 algorithm
 * for calculating optimal review intervals.
 */

export interface ScheduleData {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate the next review schedule based on user performance
 *
 * @param correct - Whether the user answered correctly
 * @param currentInterval - Current interval in days
 * @param currentEase - Current ease factor (difficulty multiplier)
 * @param currentRepetitions - Number of consecutive correct repetitions
 * @returns Updated schedule data
 */
export function calculateNextReview(
  correct: boolean,
  currentInterval: number = 1,
  currentEase: number = 2.5,
  currentRepetitions: number = 0
): ScheduleData {
  let newInterval: number;
  let newEase: number = currentEase;
  let newRepetitions: number;

  if (correct) {
    // Correct answer
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      // First correct review: 1 day
      newInterval = 1;
    } else if (newRepetitions === 2) {
      // Second correct review: 6 days
      newInterval = 6;
    } else {
      // Subsequent correct reviews: multiply by ease factor
      newInterval = Math.round(currentInterval * currentEase);
    }

    // Ease factor remains the same for correct answers
    // (In full SM-2, ease can increase slightly, but we keep it simple)
  } else {
    // Incorrect answer - reset progress
    newRepetitions = 0;
    newInterval = 1;

    // Decrease ease factor (make it harder)
    newEase = Math.max(1.3, currentEase - 0.2);
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    intervalDays: newInterval,
    easeFactor: newEase,
    repetitions: newRepetitions,
    nextReviewDate
  };
}

/**
 * Check if a card is due for review
 *
 * @param nextReviewDate - Next scheduled review date
 * @returns true if the card is due for review
 */
export function isCardDue(nextReviewDate: Date): boolean {
  const now = new Date();
  return nextReviewDate <= now;
}

/**
 * Initialize schedule for a new card
 *
 * @returns Initial schedule data for a brand new card
 */
export function initializeSchedule(): ScheduleData {
  return {
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date()
  };
}

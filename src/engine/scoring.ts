// scoring.ts — Point calculation, hand results, and party awarding logic

import { Card, CARD_POINTS } from './deck';

/**
 * Result of a single trick (one attack + one defense card played).
 * Requirements: 4.1
 */
export interface TrickResult {
  winner: 'player' | 'ai';
  points: number; // sum of both cards in the trick
}

/**
 * Result of a completed hand.
 * Requirements: 4.1–4.4
 */
export interface HandResult {
  winner: 'player' | 'ai';
  partiesAwarded: 1 | 2 | 3;
  playerScore: number;
  aiScore: number;
}

/**
 * Returns the total point value of an array of cards.
 * Requirements: 4.1
 */
export function sumCardPoints(cards: Card[]): number {
  return cards.reduce((total, card) => total + CARD_POINTS[card.rank], 0);
}

/**
 * Returns true if the given score meets or exceeds 66, winning the hand.
 * Requirements: 4.1
 */
export function hasReached66(score: number): boolean {
  return score >= 66;
}

/**
 * Calculates how many parties (game points) to award the winner of a hand.
 *
 * Rules (Requirements 4.2–4.4):
 *   - loserTricks === 0  → 3 parties (loser took no tricks at all)
 *   - loserScore < 33    → 2 parties (loser scored less than 33 points)
 *   - otherwise          → 1 party
 *
 * @param winnerScore - score of the winning player (unused in party calc, included for completeness)
 * @param loserScore  - score accumulated by the loser (from cards + announced pairs)
 * @param loserTricks - number of tricks the loser took during the hand
 */
export function calculatePartiesAwarded(
  winnerScore: number,
  loserScore: number,
  loserTricks: number
): 1 | 2 | 3 {
  // Suppress unused-variable warning — winnerScore is part of the public API
  void winnerScore;

  if (loserTricks === 0) {
    return 3;
  }
  if (loserScore < 33) {
    return 2;
  }
  return 1;
}

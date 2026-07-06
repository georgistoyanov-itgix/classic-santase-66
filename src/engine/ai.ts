// ai.ts — AI strategy for Santase 66
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.6

import { Card, CARD_POINTS } from './deck';
import { GameState, getValidDefenseMoves } from './rules';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AIDecision {
  action: 'play' | 'swap' | 'announce' | 'close';
  card?: Card;
  pair?: [Card, Card];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sorts cards by point value ascending (lowest first).
 * Non-trump cards come before trump cards of the same point value.
 */
function sortByPointsAscending(cards: Card[], trumpSuit: string | null): Card[] {
  return [...cards].sort((a, b) => {
    const pointDiff = CARD_POINTS[a.rank] - CARD_POINTS[b.rank];
    if (pointDiff !== 0) return pointDiff;
    // Prefer non-trump when equal points — keep trumps for later
    const aTrump = a.suit === trumpSuit ? 1 : 0;
    const bTrump = b.suit === trumpSuit ? 1 : 0;
    return aTrump - bTrump;
  });
}

/**
 * Checks whether the AI can announce a pair (K+Q of same suit).
 * Returns the pair [K, Q] if found, or null.
 *
 * Conditions (Requirements 6.3):
 *   - handNumber >= 2
 *   - aiTrickCount >= 1
 *   - aiHand contains K and Q of the same suit
 */
function findAnnouncablePair(state: GameState): [Card, Card] | null {
  if (state.handNumber < 2) return null;
  if (state.aiTrickCount < 1) return null;

  const { aiHand, trumpSuit } = state;

  // Group by suit
  const suits = ['♠', '♥', '♦', '♣'] as const;
  for (const suit of suits) {
    const k = aiHand.find((c) => c.suit === suit && c.rank === 'K');
    const q = aiHand.find((c) => c.suit === suit && c.rank === 'Q');
    if (k && q) {
      // Prefer announcing trump pairs (40 pts) over non-trump (20 pts)
      // but either is valid — return the first found
      void trumpSuit; // trumpSuit used only for prioritisation (not strictly required)
      return [k, q];
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Attack logic
// ---------------------------------------------------------------------------

/**
 * Chooses the best card for AI to play when attacking.
 *
 * Priority (design.md — AI strategy):
 *   1. Lowest non-trump card by point value
 *   2. If all cards are trump, lowest trump by point value
 *
 * Saves A/10/trumps for later. Never returns undefined.
 * Requirements: 6.1
 */
export function chooseAttackCard(hand: Card[], state: GameState): Card {
  if (hand.length === 0) {
    throw new Error('chooseAttackCard: AI hand is empty');
  }

  const { trumpSuit } = state;
  const sorted = sortByPointsAscending(hand, trumpSuit);

  // Prefer non-trump cards
  const nonTrump = sorted.filter((c) => c.suit !== trumpSuit);
  if (nonTrump.length > 0) {
    return nonTrump[0]!;
  }

  // All cards are trump — play the lowest one
  return sorted[0]!;
}

// ---------------------------------------------------------------------------
// Defense logic
// ---------------------------------------------------------------------------

/**
 * Chooses the best card for AI to play when defending.
 *
 * Rules:
 *   - Strict mode (isStockClosed || stock.length === 0):
 *       Follow getValidDefenseMoves strictly — return the first valid card.
 *   - Non-strict mode, handNumber >= 2:
 *       If attackCard.rank is '10' or 'A' AND AI has a trump → play lowest trump.
 *       Otherwise → play any card (lowest value).
 *   - Non-strict mode, handNumber < 2:
 *       Play any card (lowest value).
 *
 * Never returns undefined.
 * Requirements: 6.2, 6.6
 */
export function chooseDefenseCard(
  attackCard: Card,
  hand: Card[],
  state: GameState
): Card {
  if (hand.length === 0) {
    throw new Error('chooseDefenseCard: AI hand is empty');
  }

  const { trumpSuit, isStockClosed, stock } = state;
  const isStrictMode = isStockClosed || stock.length === 0;

  if (isStrictMode) {
    // Must follow strict rules
    const validMoves = getValidDefenseMoves(
      attackCard,
      hand,
      trumpSuit!,
      true
    );
    // validMoves is always non-empty (falls back to full hand when no matches)
    return sortByPointsAscending(validMoves, trumpSuit)[0]!;
  }

  // Non-strict mode
  if (state.handNumber >= 2) {
    const isStrongAttack =
      attackCard.rank === '10' || attackCard.rank === 'A';

    if (isStrongAttack && trumpSuit !== null) {
      const trumpCards = hand.filter((c) => c.suit === trumpSuit);
      if (trumpCards.length > 0) {
        // Play lowest trump (Requirement 6.6)
        return sortByPointsAscending(trumpCards, trumpSuit)[0]!;
      }
    }
  }

  // Default: play the lowest-value card from hand
  return sortByPointsAscending(hand, trumpSuit)[0]!;
}

// ---------------------------------------------------------------------------
// Main AI decision entry point
// ---------------------------------------------------------------------------

/**
 * Returns the AI's decision for the current turn.
 *
 * - phase 'ai-attack':   apply attack priority logic
 * - phase 'ai-defense':  apply defense logic
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function getAIDecision(state: GameState): AIDecision {
  const { phase, aiHand, attackCard, isStockClosed } = state;

  if (phase === 'ai-attack') {
    // Priority 1: Announce pair if possible (Requirements 6.3)
    const pair = findAnnouncablePair(state);
    if (pair !== null) {
      return { action: 'announce', pair };
    }

    // Priority 2 (swap trump nine) — skipped for MVP as per design.md

    // Priority 3: Close stock if AI is winning comfortably (Requirements 6.4)
    if (
      state.aiScore >= 50 &&
      state.playerScore < 30 &&
      !isStockClosed
    ) {
      return { action: 'close' };
    }

    // Priority 4: Play lowest non-trump card
    const card = chooseAttackCard(aiHand, state);
    return { action: 'play', card };
  }

  if (phase === 'ai-defense') {
    if (attackCard === null) {
      throw new Error('getAIDecision: phase is ai-defense but attackCard is null');
    }
    const card = chooseDefenseCard(attackCard, aiHand, state);
    return { action: 'play', card };
  }

  throw new Error(`getAIDecision: unexpected phase "${phase}"`);
}

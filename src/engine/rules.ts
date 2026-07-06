// rules.ts — Move validation, special action checks for Santase 66

import { Card, Suit } from './deck';

// ---------------------------------------------------------------------------
// TurnPhase & GameState
// ---------------------------------------------------------------------------

export type TurnPhase =
  | 'player-attack'
  | 'player-defense'
  | 'ai-attack'
  | 'ai-defense'
  | 'trick-resolution'
  | 'draw-phase'
  | 'hand-over'
  | 'game-over';

export interface GameState {
  // Cards
  playerHand: Card[];
  aiHand: Card[];
  stock: Card[];           // Draw pile (excludes trump card)
  trumpCard: Card | null;  // Trump card visible under the stock
  trumpSuit: Suit | null;

  // Current turn
  phase: TurnPhase;
  attackCard: Card | null;
  defenseCard: Card | null;

  // Captured cards (for scoring)
  playerTricks: Card[];
  aiTricks: Card[];

  // Scores (cards + announced pairs)
  playerScore: number;
  aiScore: number;
  playerTrickCount: number; // Number of tricks taken (for party calculation)
  aiTrickCount: number;

  // Special actions
  isStockClosed: boolean;
  stockClosedBy: 'player' | 'ai' | null;
  announcedPairs: Array<{ player: 'player' | 'ai'; points: number }>;

  // Meta
  handNumber: number;      // 1-based; pair announcements forbidden in hand 1
  playerParties: number;   // Win at 7
  aiParties: number;
  isGameOver: boolean;
  winner: 'player' | 'ai' | null;
}

// ---------------------------------------------------------------------------
// Defense move validation
// ---------------------------------------------------------------------------

/**
 * Strict defense priority (Requirements 2.5):
 *   1. If hand has cards of the same suit as the attack card → must play one
 *   2. Else if hand has trump cards → must play a trump
 *   3. Else → any card is valid
 *
 * In non-strict mode (stock open, not exhausted) any card is valid.
 *
 * Requirements: 2.5
 */
export function isValidDefenseMove(
  attackCard: Card,
  defenseCard: Card,
  hand: Card[],
  trumpSuit: Suit,
  isStrictMode: boolean
): boolean {
  if (!isStrictMode) {
    return true;
  }

  const sameSuitCards = hand.filter((c) => c.suit === attackCard.suit);
  if (sameSuitCards.length > 0) {
    // Must follow suit
    return defenseCard.suit === attackCard.suit;
  }

  const trumpCards = hand.filter((c) => c.suit === trumpSuit);
  if (trumpCards.length > 0) {
    // Must play trump
    return defenseCard.suit === trumpSuit;
  }

  // No suit match and no trumps — any card is fine
  return true;
}

/**
 * Returns all cards from hand that are valid defense responses to attackCard.
 *
 * Requirements: 2.5
 */
export function getValidDefenseMoves(
  attackCard: Card,
  hand: Card[],
  trumpSuit: Suit,
  isStrictMode: boolean
): Card[] {
  if (!isStrictMode) {
    return [...hand];
  }

  const sameSuitCards = hand.filter((c) => c.suit === attackCard.suit);
  if (sameSuitCards.length > 0) {
    return sameSuitCards;
  }

  const trumpCards = hand.filter((c) => c.suit === trumpSuit);
  if (trumpCards.length > 0) {
    return trumpCards;
  }

  return [...hand];
}

// ---------------------------------------------------------------------------
// Special action guards
// ---------------------------------------------------------------------------

/**
 * Returns true if the player is allowed to swap the trump nine right now.
 *
 * Conditions (Requirements 3.1):
 *   - Stock is open (not closed)
 *   - Player is on attack (phase === 'player-attack')
 *   - Player has the 9 of trumpSuit in hand
 *   - Stock has at least 1 card (trump card is still in play)
 *
 * Requirements: 3.1
 */
export function canSwapTrumpNine(state: GameState): boolean {
  if (state.isStockClosed) return false;
  if (state.phase !== 'player-attack') return false;
  if (state.trumpSuit === null) return false;
  if (state.stock.length === 0) return false;

  return state.playerHand.some(
    (c) => c.rank === '9' && c.suit === state.trumpSuit
  );
}

/**
 * Returns true if the player is allowed to announce the pair (card1 + card2).
 *
 * Conditions (Requirements 3.2, 3.3, 3.4):
 *   - card1 and card2 are K + Q of the same suit
 *   - Player is on attack (phase === 'player-attack')
 *   - handNumber >= 2 (no pair announcements in hand 1)
 *   - playerTrickCount >= 1 (player must have taken at least one trick)
 *
 * Requirements: 3.2, 3.3, 3.4
 */
export function canAnnouncePair(
  card1: Card,
  card2: Card,
  state: GameState
): boolean {
  if (state.phase !== 'player-attack') return false;
  if (state.handNumber < 2) return false;
  if (state.playerTrickCount < 1) return false;

  // Must be K + Q of the same suit
  const isKQ =
    card1.suit === card2.suit &&
    ((card1.rank === 'K' && card2.rank === 'Q') ||
      (card1.rank === 'Q' && card2.rank === 'K'));

  return isKQ;
}

/**
 * Returns true if the player is allowed to close the stock right now.
 *
 * Conditions (Requirements 3.4):
 *   - Stock is currently open (isStockClosed === false)
 *   - Player is on attack (phase === 'player-attack')
 *
 * Requirements: 3.4 (closing the stock)
 */
export function canCloseStock(state: GameState): boolean {
  return !state.isStockClosed && state.phase === 'player-attack';
}

// deck.ts — Card types, deck creation, shuffling, and dealing logic

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '9' | 'J' | 'Q' | 'K' | '10' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // `${rank}${suit}` — unique identifier
}

/** Point values per requirement 1.2 */
export const CARD_POINTS: Record<Rank, number> = {
  'A': 11,
  '10': 10,
  'K': 5,
  'Q': 4,
  'J': 3,
  '9': 0,
};

export interface DealResult {
  playerHand: Card[];
  aiHand: Card[];
  stock: Card[];
  trumpCard: Card;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['9', 'J', 'Q', 'K', '10', 'A'];

/**
 * Creates a standard Santase deck of 24 unique cards (6 ranks × 4 suits).
 * Requirements: 1.1
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}` });
    }
  }
  return deck;
}

/**
 * Returns a new shuffled copy of the deck using the Fisher-Yates algorithm.
 * Does NOT mutate the input array.
 * Requirements: 1.1
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at i and j
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Returns the point value of a card.
 * Requirements: 1.2
 */
export function getCardPoints(card: Card): number {
  return CARD_POINTS[card.rank];
}

/**
 * Deals hands from a shuffled deck of 24 cards.
 *   - playerHand: first 6 cards (indices 0–5)
 *   - aiHand:     next 6 cards (indices 6–11)
 *   - trumpCard:  last card of the deck (index 23) — visible under the stock
 *   - stock:      remaining 11 cards (indices 12–22)
 *
 * Total: 6 + 6 + 11 + 1 = 24 ✓
 * Requirements: 1.3, 1.4
 */
export function dealHands(deck: Card[]): DealResult {
  if (deck.length !== 24) {
    throw new Error(`dealHands expects a 24-card deck, got ${deck.length}`);
  }

  const playerHand = deck.slice(0, 6);
  const aiHand = deck.slice(6, 12);
  const stock = deck.slice(12, 23);
  const trumpCard = deck[23]!;

  return { playerHand, aiHand, stock, trumpCard };
}

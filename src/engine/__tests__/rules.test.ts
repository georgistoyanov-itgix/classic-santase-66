// Feature: santase-66, Property 6: Strict defense rules are correct
// Validates: Requirements 2.5
import * as fc from 'fast-check';
import { Card, Suit, Rank } from '../deck';
import { getValidDefenseMoves } from '../rules';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['9', 'J', 'Q', 'K', '10', 'A'];

// Arbitrary for a single card
const cardArb = fc.record({
  suit: fc.constantFrom(...SUITS),
  rank: fc.constantFrom(...RANKS),
}).map(({ suit, rank }) => ({ suit, rank, id: `${rank}${suit}` } as Card));

// Arbitrary for a hand of 1–6 unique cards (sample from a deck)
const handArb = fc.array(cardArb, { minLength: 1, maxLength: 6 });

describe('Rules property tests', () => {
  it('Property 6: strict defense moves always follow the correct priority', () => {
    fc.assert(
      fc.property(
        cardArb,                        // attackCard
        handArb,                        // defender's hand
        fc.constantFrom(...SUITS),      // trumpSuit
        (attackCard, hand, trumpSuit) => {
          const validMoves = getValidDefenseMoves(attackCard, hand, trumpSuit, true);

          const sameSuit = hand.filter(c => c.suit === attackCard.suit);
          const trumps   = hand.filter(c => c.suit === trumpSuit);

          if (sameSuit.length > 0) {
            // Every returned card must be same suit as attack
            expect(validMoves.every(c => c.suit === attackCard.suit)).toBe(true);
            expect(validMoves.length).toBeGreaterThan(0);
          } else if (trumps.length > 0) {
            // Every returned card must be trump
            expect(validMoves.every(c => c.suit === trumpSuit)).toBe(true);
            expect(validMoves.length).toBeGreaterThan(0);
          } else {
            // No suit match and no trumps — all cards in hand are valid
            expect(validMoves.length).toBe(hand.length);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ─── Unit tests for task 4.3 ───────────────────────────────────────────────
import { GameState, canSwapTrumpNine, canAnnouncePair, canCloseStock } from '../rules';

const baseState: GameState = {
  playerHand: [], aiHand: [], stock: [], trumpCard: null, trumpSuit: '♥',
  phase: 'player-attack', attackCard: null, defenseCard: null,
  playerTricks: [], aiTricks: [], playerScore: 0, aiScore: 0,
  playerTrickCount: 0, aiTrickCount: 0, isStockClosed: false,
  stockClosedBy: null, announcedPairs: [], handNumber: 1,
  playerParties: 0, aiParties: 0, isGameOver: false, winner: null,
};

describe('Rules unit tests', () => {
  it('strict: has same suit → only same-suit cards valid', () => {
    const attack: Card = { suit: '♥', rank: '10', id: '10♥' };
    const hand: Card[] = [{ suit: '♥', rank: 'K', id: 'K♥' }, { suit: '♠', rank: 'J', id: 'J♠' }];
    const valid = getValidDefenseMoves(attack, hand, '♦', true);
    expect(valid).toHaveLength(1);
    expect(valid[0]!.suit).toBe('♥');
  });

  it('strict: no same suit, has trump → only trumps valid', () => {
    const attack: Card = { suit: '♥', rank: '10', id: '10♥' };
    const hand: Card[] = [{ suit: '♠', rank: 'J', id: 'J♠' }, { suit: '♣', rank: 'K', id: 'K♣' }];
    const valid = getValidDefenseMoves(attack, hand, '♣', true);
    expect(valid).toHaveLength(1);
    expect(valid[0]!.suit).toBe('♣');
  });

  it('strict: no suit, no trump → all cards valid', () => {
    const attack: Card = { suit: '♥', rank: '10', id: '10♥' };
    const hand: Card[] = [{ suit: '♠', rank: 'J', id: 'J♠' }, { suit: '♣', rank: 'K', id: 'K♣' }];
    const valid = getValidDefenseMoves(attack, hand, '♦', true);
    expect(valid).toHaveLength(2);
  });

  it('canSwapTrumpNine: closed stock → false', () => {
    const state: GameState = {
      ...baseState,
      isStockClosed: true,
      trumpSuit: '♥',
      playerHand: [{ suit: '♥', rank: '9', id: '9♥' }],
      stock: [{ suit: '♠', rank: 'A', id: 'A♠' }],
    };
    expect(canSwapTrumpNine(state)).toBe(false);
  });

  it('canSwapTrumpNine: open, has 9 of trump, attack phase → true', () => {
    const state: GameState = {
      ...baseState,
      isStockClosed: false,
      trumpSuit: '♥',
      phase: 'player-attack',
      playerHand: [{ suit: '♥', rank: '9', id: '9♥' }],
      stock: [{ suit: '♠', rank: 'A', id: 'A♠' }],
    };
    expect(canSwapTrumpNine(state)).toBe(true);
  });

  it('canAnnouncePair: handNumber=1 → false', () => {
    const k: Card = { suit: '♠', rank: 'K', id: 'K♠' };
    const q: Card = { suit: '♠', rank: 'Q', id: 'Q♠' };
    const state: GameState = { ...baseState, handNumber: 1, playerTrickCount: 1, phase: 'player-attack' };
    expect(canAnnouncePair(k, q, state)).toBe(false);
  });

  it('canAnnouncePair: handNumber>=2, K+Q same suit, trickCount>=1, attack phase → true', () => {
    const k: Card = { suit: '♠', rank: 'K', id: 'K♠' };
    const q: Card = { suit: '♠', rank: 'Q', id: 'Q♠' };
    const state: GameState = { ...baseState, handNumber: 2, playerTrickCount: 1, phase: 'player-attack' };
    expect(canAnnouncePair(k, q, state)).toBe(true);
  });

  it('canCloseStock: open, attack phase → true', () => {
    expect(canCloseStock({ ...baseState, isStockClosed: false, phase: 'player-attack' })).toBe(true);
  });

  it('canCloseStock: already closed → false', () => {
    expect(canCloseStock({ ...baseState, isStockClosed: true, phase: 'player-attack' })).toBe(false);
  });
});

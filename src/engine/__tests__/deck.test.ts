// Feature: santase-66, Properties 1-4: Deck invariants
import * as fc from 'fast-check';
import { createDeck, shuffleDeck, dealHands } from '../deck';
import { sumCardPoints } from '../scoring';

describe('Deck property tests', () => {
  it('Property 1: shuffleDeck always produces 24 unique cards', () => {
    // Validates: Requirements 1.1
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = shuffleDeck(createDeck());
        expect(deck).toHaveLength(24);
        const ids = deck.map(c => c.id);
        expect(new Set(ids).size).toBe(24);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 2: total card points are constant regardless of shuffle', () => {
    // Validates: Requirements 1.2
    const expectedTotal = sumCardPoints(createDeck());
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = shuffleDeck(createDeck());
        expect(sumCardPoints(deck)).toBe(expectedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: total card count after deal is always 24', () => {
    // Validates: Requirements 1.3
    fc.assert(
      fc.property(fc.constant(null), () => {
        const result = dealHands(shuffleDeck(createDeck()));
        const total =
          result.playerHand.length +
          result.aiHand.length +
          result.stock.length +
          1; // trumpCard counts as 1
        expect(total).toBe(24);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4: trumpCard.suit is always a valid Suit', () => {
    // Validates: Requirements 1.4
    const validSuits = ['♠', '♥', '♦', '♣'];
    fc.assert(
      fc.property(fc.constant(null), () => {
        const result = dealHands(shuffleDeck(createDeck()));
        expect(validSuits).toContain(result.trumpCard.suit);
      }),
      { numRuns: 100 }
    );
  });
});

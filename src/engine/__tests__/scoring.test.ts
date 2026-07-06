// Feature: santase-66, Property 5: Parties function covers all cases
// Validates: Requirements 4.2, 4.3, 4.4
import * as fc from 'fast-check';
import { Card } from '../deck';
import { calculatePartiesAwarded, hasReached66, sumCardPoints } from '../scoring';

describe('Scoring property tests', () => {
  it('Property 5: calculatePartiesAwarded covers all three branches', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 65 }),
        fc.nat(),
        (loserScore, loserTricks) => {
          const result = calculatePartiesAwarded(66, loserScore, loserTricks);
          if (loserTricks === 0) {
            expect(result).toBe(3);
          } else if (loserScore < 33) {
            expect(result).toBe(2);
          } else {
            expect(result).toBe(1);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Scoring unit tests', () => {
  it('hasReached66: exactly 66 → true', () => {
    expect(hasReached66(66)).toBe(true);
  });

  it('hasReached66: 65 → false', () => {
    expect(hasReached66(65)).toBe(false);
  });

  it('hasReached66: above 66 → true', () => {
    expect(hasReached66(100)).toBe(true);
  });

  it('sumCardPoints: K + Q = 9', () => {
    const cards: Card[] = [
      { suit: '♥', rank: 'K', id: 'K♥' },
      { suit: '♥', rank: 'Q', id: 'Q♥' },
    ];
    expect(sumCardPoints(cards)).toBe(9);
  });

  it('calculatePartiesAwarded: loserTricks=0 → 3', () => {
    expect(calculatePartiesAwarded(66, 0, 0)).toBe(3);
  });

  it('calculatePartiesAwarded: loserScore=20, loserTricks=2 → 2', () => {
    expect(calculatePartiesAwarded(66, 20, 2)).toBe(2);
  });

  it('calculatePartiesAwarded: loserScore=40, loserTricks=3 → 1', () => {
    expect(calculatePartiesAwarded(66, 40, 3)).toBe(1);
  });
});

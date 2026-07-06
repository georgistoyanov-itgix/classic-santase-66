// Feature: santase-66, Properties 8+9 and AI unit tests
// Validates: Requirements 6.1, 6.2, 6.6, 6.4, 6.3
import * as fc from 'fast-check';
import { Card, Suit, Rank } from '../deck';
import { GameState } from '../rules';
import { getAIDecision, chooseDefenseCard } from '../ai';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['9', 'J', 'Q', 'K', '10', 'A'];

const cardArb = fc.record({
  suit: fc.constantFrom(...SUITS),
  rank: fc.constantFrom(...RANKS),
}).map(({ suit, rank }) => ({ suit, rank, id: `${rank}${suit}` } as Card));

function makeAttackState(
  aiHand: Card[],
  aiScore: number,
  playerScore: number,
  handNumber: number,
  aiTrickCount: number,
): GameState {
  return {
    playerHand: [],
    aiHand,
    stock: [{ suit: '♠', rank: 'J', id: 'J♠' }],
    trumpCard: { suit: '♥', rank: '9', id: '9♥' },
    trumpSuit: '♥',
    phase: 'ai-attack',
    attackCard: null,
    defenseCard: null,
    playerTricks: [],
    aiTricks: [],
    playerScore,
    aiScore,
    playerTrickCount: 1,
    aiTrickCount,
    isStockClosed: false,
    stockClosedBy: null,
    announcedPairs: [],
    handNumber,
    playerParties: 0,
    aiParties: 0,
    isGameOver: false,
    winner: null,
  };
}

function makeDefenseState(
  aiHand: Card[],
  attackCard: Card,
  isStockClosed: boolean,
  stockLen: number,
  handNumber: number,
): GameState {
  const stock: Card[] = Array.from(
    { length: stockLen },
    (_, i) => ({ suit: '♠', rank: 'J' as Rank, id: `J♠${i}` }),
  );
  return {
    playerHand: [],
    aiHand,
    stock,
    trumpCard: null,
    trumpSuit: '♥',
    phase: 'ai-defense',
    attackCard,
    defenseCard: null,
    playerTricks: [],
    aiTricks: [],
    playerScore: 0,
    aiScore: 0,
    playerTrickCount: 1,
    aiTrickCount: 1,
    isStockClosed,
    stockClosedBy: null,
    announcedPairs: [],
    handNumber,
    playerParties: 0,
    aiParties: 0,
    isGameOver: false,
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

describe('AI property tests', () => {
  it('Property 8: AI attack decision card is always in aiHand', () => {
    // Validates: Requirements 6.1, 6.2
    const handArb = fc.array(cardArb, { minLength: 1, maxLength: 6 });
    fc.assert(
      fc.property(
        handArb,
        fc.integer({ min: 0, max: 65 }),
        fc.integer({ min: 0, max: 65 }),
        fc.integer({ min: 1, max: 5 }),
        fc.nat({ max: 5 }),
        (aiHand, aiScore, playerScore, handNumber, aiTrickCount) => {
          const state = makeAttackState(aiHand, aiScore, playerScore, handNumber, aiTrickCount);
          const decision = getAIDecision(state);
          if (decision.action === 'play' && decision.card) {
            expect(aiHand.some(c => c.id === decision.card!.id)).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('Property 9: AI plays trump against 10/A when stock open, handNumber >= 2', () => {
    // Validates: Requirements 6.6
    const strongRanks: Rank[] = ['10', 'A'];
    fc.assert(
      fc.property(
        fc.constantFrom(...strongRanks),
        fc.constantFrom(...SUITS),
        (attackRank, attackSuit) => {
          const attackCard: Card = {
            suit: attackSuit,
            rank: attackRank,
            id: `${attackRank}${attackSuit}`,
          };
          const trumpCard: Card = { suit: '♥', rank: 'K', id: 'K♥' };
          const nonTrump: Card = { suit: '♠', rank: 'J', id: 'J♠' };
          const aiHand = [trumpCard, nonTrump];
          // stock open (isStockClosed=false), stockLen=2, handNumber=2
          const state = makeDefenseState(aiHand, attackCard, false, 2, 2);
          const chosen = chooseDefenseCard(attackCard, aiHand, state);
          expect(chosen.suit).toBe('♥');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('AI unit tests', () => {
  it('AI closes stock when aiScore >= 50 and playerScore < 30', () => {
    // Validates: Requirements 6.4
    const state = makeAttackState(
      [{ suit: '♠', rank: 'J', id: 'J♠' }],
      52,
      20,
      1,
      0,
    );
    const decision = getAIDecision({ ...state, isStockClosed: false });
    expect(decision.action).toBe('close');
  });

  it('AI announces pair K♠+Q♠ when conditions met (handNumber>=2, aiTrickCount>=1)', () => {
    // Validates: Requirements 6.3
    const k: Card = { suit: '♠', rank: 'K', id: 'K♠' };
    const q: Card = { suit: '♠', rank: 'Q', id: 'Q♠' };
    const state = makeAttackState(
      [k, q, { suit: '♦', rank: 'J', id: 'J♦' }],
      0,
      0,
      2,
      1,
    );
    const decision = getAIDecision(state);
    expect(decision.action).toBe('announce');
    expect(decision.pair).toBeDefined();
  });
});

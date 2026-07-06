// gameStore.ts — Zustand store for Santase 66 game state
import { create } from 'zustand';
import { Card } from '../engine/deck';
import { GameState, TurnPhase } from '../engine/rules';
import { createDeck, shuffleDeck, dealHands } from '../engine/deck';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: GameState = {
  playerHand: [],
  aiHand: [],
  stock: [],
  trumpCard: null,
  trumpSuit: null,
  phase: 'player-attack' as TurnPhase,
  attackCard: null,
  defenseCard: null,
  playerTricks: [],
  aiTricks: [],
  playerScore: 0,
  aiScore: 0,
  playerTrickCount: 0,
  aiTrickCount: 0,
  isStockClosed: false,
  stockClosedBy: null,
  announcedPairs: [],
  handNumber: 0,
  playerParties: 0,
  aiParties: 0,
  isGameOver: false,
  winner: null,
};

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export interface GameStore extends GameState {
  startNewGame: () => void;
  startNewHand: () => void;
  // Stub actions — will be implemented in later tasks
  playCard: (card: Card) => void;
  swapTrumpNine: () => void;
  announcePair: (card1: Card, card2: Card) => void;
  closeStock: () => void;
  _resolveAITurn: () => void;
  _drawCards: () => void;
  _resolveTrick: () => void;
  _resolveHandEnd: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startNewGame: () => {
    set({
      playerParties: 0,
      aiParties: 0,
      isGameOver: false,
      winner: null,
      handNumber: 1,
    });
    get().startNewHand();
  },

  startNewHand: () => {
    const shuffled = shuffleDeck(createDeck());
    const { playerHand, aiHand, stock, trumpCard } = dealHands(shuffled);

    set((state) => ({
      playerHand,
      aiHand,
      stock,
      trumpCard,
      trumpSuit: trumpCard.suit,
      phase: 'player-attack' as TurnPhase,
      attackCard: null,
      defenseCard: null,
      playerTricks: [],
      aiTricks: [],
      playerScore: 0,
      aiScore: 0,
      playerTrickCount: 0,
      aiTrickCount: 0,
      isStockClosed: false,
      stockClosedBy: null,
      announcedPairs: [],
      // On the first call from startNewGame, handNumber is already 1.
      // On subsequent calls (new hand within an ongoing game), increment it.
      handNumber: state.handNumber === 0 ? 1 : state.handNumber + 1,
    }));
  },

  // Stub implementations — throw until filled in by later tasks
  playCard: (_card: Card) => {
    throw new Error('Not implemented yet');
  },

  swapTrumpNine: () => {
    throw new Error('Not implemented yet');
  },

  announcePair: (_card1: Card, _card2: Card) => {
    throw new Error('Not implemented yet');
  },

  closeStock: () => {
    throw new Error('Not implemented yet');
  },

  _resolveAITurn: () => {
    throw new Error('Not implemented yet');
  },

  _drawCards: () => {
    throw new Error('Not implemented yet');
  },

  _resolveTrick: () => {
    throw new Error('Not implemented yet');
  },

  _resolveHandEnd: () => {
    throw new Error('Not implemented yet');
  },
}));

import { gameReducer } from '../reducer';
import { Player, scenarios, Marks, Imperative, Result } from '../../../core';
import * as actions from '../actions';
import * as state from '../state';

import {
  // itSends,
  itTransitionsTo,
  // itStoresAction,
  itIncreasesTurnNumBy,
  // itHandlesResignLikeItsMyTurn,
  // itHandlesResignLikeItsTheirTurn,
  itSends,
} from './helpers';

const {
  // preFundSetupA,
  // preFundSetupB,
  // postFundSetupA,
  postFundSetupB,
  playing1,
  playing2,
  playing3,
  // playing4,
  // playing5,
  // playing6,
  // playing7,
  playing8,
  draw,
  // resting,
} = scenarios.standard;



const { libraryAddress, channelNonce, participants, roundBuyIn, myName, opponentName } = scenarios.standard;
const base = { libraryAddress, channelNonce, participants, roundBuyIn, myName, opponentName };

const messageState = {};

describe('player A\'s app', () => {
  const aProps = {
    ...base,
    stateCount: 1,
    player: Player.PlayerA,
    twitterHandle: 'tweet',
  };

  describe('when in XsPickMove', () => {

    describe('when making an inconclusive XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({ ...aProps, noughts: 0, crosses: 0, ...postFundSetupB, result: Imperative.Wait });
      const action = actions.marksMade(Marks.tl);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, { gameState, messageState }, updatedState);
      itTransitionsTo(state.StateName.XsWaitForOpponentToPickMove, updatedState);
      itSends(playing1, updatedState);
    });

    describe('when making a drawing XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({ ...aProps, ...playing8, result: Imperative.Wait });
      const action = actions.marksMade(Marks.bm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, { gameState, messageState }, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(draw, updatedState);
    });

    describe('when making a winning XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({ ...aProps, ...scenarios.crossesVictory.playing4, result: Imperative.Wait });
      const action = actions.marksMade(Marks.tr);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, { gameState, messageState }, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(scenarios.crossesVictory.victory, updatedState);
    });
  });

  describe('when in XsWaitForOpponentToPickMove', () => {

    describe('when inconclusive Oplaying arrives', () => {
      const gameState = state.xsWaitForOpponentToPickMove({ ...aProps, ...playing1, result: Imperative.Wait });
      const action = actions.marksMade(playing2.noughts);
      const receivedNoughts = playing2.noughts;

      const updatedState = gameReducer({ messageState, gameState }, action);

      itTransitionsTo(state.StateName.XsPickMove, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.XsPickMove;
        expect(newGameState.noughts).toEqual(receivedNoughts);
      });
    });

    // a draw cannot arrive if we are Xs

    describe('when Victory arrives', () => {
      const action = actions.marksMade(scenarios.noughtsVictory.victory.noughts);
      const receivedNoughts = scenarios.noughtsVictory.victory.noughts;

      describe('but they still have enough funds to continue', () => {
        const gameState = state.xsWaitForOpponentToPickMove({ ...aProps, ...scenarios.noughtsVictory.playing5, result: Imperative.Wait });
        const updatedState = gameReducer({ messageState, gameState }, action);

        itTransitionsTo(state.StateName.PlayAgain, updatedState);
        itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
        it('sets theirMarks', () => {
          const newGameState = updatedState.gameState as state.XsPickMove;
          expect(newGameState.noughts).toEqual(receivedNoughts);
        });
      });

      describe('and there are now insufficient funds', () => {
        const gameState = state.xsWaitForOpponentToPickMove({ ...aProps, ...scenarios.noughtsVictory.playing5closetoempty, result: Imperative.Wait });
        const updatedState = gameReducer({ messageState, gameState }, action);

        itTransitionsTo(state.StateName.InsufficientFunds, updatedState);
        itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
        it('sets theirMarks', () => {
          const newGameState = updatedState.gameState as state.XsPickMove;
          expect(newGameState.noughts).toEqual(receivedNoughts);
        });
      });
    });
  });
});

describe('player B\'s app', () => {
  const bProps = {
    ...base,
    stateCount: 1,
    player: Player.PlayerB,
    twitterHandle: 'tweet',
  };

  describe('when in OsPickMove', () => {

    describe('when making an inconclusive OS_CHOSE_MOVE', () => {
      const gameState = state.osPickMove({ ...bProps, ...playing1, result: Imperative.Wait });
      const action = actions.marksMade(Marks.mm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, { gameState, messageState }, updatedState);
      itTransitionsTo(state.StateName.OsWaitForOpponentToPickMove, updatedState);
      itSends(playing2, updatedState);
    });

    describe('when making a winning OS_CHOSE_MOVE', () => {
      const gameState = state.osPickMove({ ...bProps, ...scenarios.noughtsVictory.playing5, result: Result.YouWin });
      const action = actions.marksMade(Marks.tr);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, { gameState, messageState }, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(scenarios.noughtsVictory.victory, updatedState);
    });
  });

  describe('when in OsWaitForOpponentToPickMove', () => {

    describe('when inconclusive Xplaying arrives', () => {
      const gameState = state.osWaitForOpponentToPickMove({ ...bProps, ...playing2, result: Imperative.Wait });
      const action = actions.marksMade(playing3.crosses);
      const receivedCrosses = playing3.crosses;

      const updatedState = gameReducer({ messageState, gameState }, action);

      itTransitionsTo(state.StateName.OsPickMove, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.OsPickMove;
        expect(newGameState.crosses).toEqual(receivedCrosses);
      });
    });

    describe('when Draw arrives', () => {
      const gameState = state.osWaitForOpponentToPickMove({ ...bProps, ...playing8, result: Imperative.Wait  });
      const action = actions.marksMade(draw.crosses);
      const receivedCrosses = draw.crosses;
      const updatedState = gameReducer({ messageState, gameState }, action);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.OsPickMove;
        expect(newGameState.crosses).toEqual(receivedCrosses);
      });
    });

    describe('when Victory arrives', () => {
      const action = actions.marksMade(scenarios.crossesVictory.victory.crosses);
      const receivedCrosses = scenarios.crossesVictory.victory.crosses;

      describe('but they still have enough funds to continue', () => {
        const gameState = state.osWaitForOpponentToPickMove({ ...bProps, ...scenarios.crossesVictory.playing4, result: Imperative.Wait  });
        const updatedState = gameReducer({ messageState, gameState }, action);

        itTransitionsTo(state.StateName.PlayAgain, updatedState);
        itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
        it('sets theirMarks', () => {
          const newGameState = updatedState.gameState as state.OsPickMove;
          expect(newGameState.crosses).toEqual(receivedCrosses);
        });
      });

      describe('and there are now insufficient funds', () => {
        const gameState = state.osWaitForOpponentToPickMove({ ...bProps, ...scenarios.crossesVictory.playing4closetoempty, result: Imperative.Wait  });
        const updatedState = gameReducer({ messageState, gameState }, action);

        itTransitionsTo(state.StateName.InsufficientFunds, updatedState);
        itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
        it('sets theirMarks', () => {
          const newGameState = updatedState.gameState as state.OsPickMove;
          expect(newGameState.crosses).toEqual(receivedCrosses);
        });
      });
    });
  });
});

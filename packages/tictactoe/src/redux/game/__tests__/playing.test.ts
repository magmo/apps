import { gameReducer } from '../reducer';
import { Player, scenarios, Marks } from '../../../core';
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

const messageState = { };

describe('player A\'s app', () => {
  const aProps = {
    ...base,
    stateCount: 1,
    player: Player.PlayerA,
    noughts: 0,
    crosses: 0,
    twitterHandle: 'tweet',
  };

  describe('when in XsPickMove', () => {
    
    describe('when making an inconclusive XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({...aProps, ...postFundSetupB });
      const action = actions.xsMoveChosen(Marks.tl);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.XsWaitForOpponentToPickMove, updatedState);
      itSends(playing1, updatedState);
    });

    describe('when making a drawing XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({...aProps, ...playing8 });
      const action = actions.xsMoveChosen(Marks.bm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(draw, updatedState);
    });

    // itHandlesResignLikeItsTheirTurn(gameState, messageState);
  });

  describe('when in XsWaitForOpponentToPickMove', () => {
    const gameState = state.xsWaitForOpponentToPickMove({...aProps, ...playing1});

    describe('when inconclusive Oplaying arrives', () => {
      const action = actions.marksReceived(playing2.noughts);
      const received_noughts = playing2.noughts;

      const updatedState = gameReducer({ messageState, gameState }, action);

      itTransitionsTo(state.StateName.XsPickMove, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.PlayAgain;
        expect(newGameState.noughts).toEqual(received_noughts);
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
      const gameState = state.osPickMove({...bProps, ...playing1 });
      const action = actions.osMoveChosen(Marks.mm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.OsWaitForOpponentToPickMove, updatedState);
      itSends(playing2, updatedState);
    });

    describe('when making a winning OS_CHOSE_MOVE', () => {
      const gameState = state.osPickMove({...bProps, ...scenarios.noughtsVictory.playing5 });
      const action = actions.osMoveChosen(Marks.tr);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(scenarios.noughtsVictory.victory, updatedState);
    });

    // itHandlesResignLikeItsTheirTurn(gameState, messageState);
  });
  
  describe('when in OsWaitForOpponentToPickMove', () => {
    const gameState = state.osWaitForOpponentToPickMove({...bProps, ...playing2});

    describe('when inconclusive Xplaying arrives', () => {
      const action = actions.marksReceived(playing3.crosses);
      const received_crosses = playing3.crosses;

      const updatedState = gameReducer({ messageState, gameState }, action);

      itTransitionsTo(state.StateName.OsPickMove, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.PlayAgain;
        expect(newGameState.crosses).toEqual(received_crosses);
      });
    });
  });
});

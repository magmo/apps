import { gameReducer } from '../reducer';
import { Player, scenarios, SingleMarks } from '../../../core';
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
  // playing3,
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
      const action = actions.xsMoveChosen(SingleMarks.tl);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.XsWaitForOpponentToPickMove, updatedState);
      itSends(playing1, updatedState);
    });

    describe('when making a drawing XS_CHOSE_MOVE', () => {
      const gameState = state.xsPickMove({...aProps, ...playing8 });
      const action = actions.xsMoveChosen(SingleMarks.bm);
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
      const action = actions.positionReceived(playing1);
      const recieved_noughts = playing1.noughts;

      const updatedState = gameReducer({ messageState, gameState }, action);

      // itSends(reveal, updatedState);
      itTransitionsTo(state.StateName.XsPickMove, updatedState);
      itIncreasesTurnNumBy(0, { gameState, messageState }, updatedState);
      it('sets theirMarks', () => {
        const newGameState = updatedState.gameState as state.PlayAgain;
        expect(newGameState.noughts).toEqual(recieved_noughts);
        // expect(newGameState.result).toEqual(aResult);
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
      const action = actions.osMoveChosen(SingleMarks.mm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.OsWaitForOpponentToPickMove, updatedState);
      itSends(playing2, updatedState);
    });

    describe('when making a winning OS_CHOSE_MOVE', () => {
      const gameState = state.osPickMove({...bProps, ...scenarios.noughtsVictory.playing5 });
      const action = actions.osMoveChosen(SingleMarks.tr);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.PlayAgain, updatedState);
      itSends(scenarios.noughtsVictory.victory, updatedState);
    });

    // itHandlesResignLikeItsTheirTurn(gameState, messageState);
  });
});

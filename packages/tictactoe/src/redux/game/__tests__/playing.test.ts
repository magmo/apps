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
  // playing8,
  // draw,
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
    const gameState = state.xsPickMove({...aProps, ...postFundSetupB });

    describe('when receiving XS_CHOSE_MOVE', () => {
      const action = actions.xsMoveChosen(SingleMarks.tl);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.XsWaitForOpponentToPickMove, updatedState);
      itSends(playing1, updatedState);
    });

    // itHandlesResignLikeItsTheirTurn(gameState, messageState);
  });
});

describe('player B\'s app', () => {
  const aProps = {
    ...base,
    stateCount: 1,
    player: Player.PlayerB,
    twitterHandle: 'tweet',
  };

  describe('when in OsWaitForOpponentToPickMove', () => {
    const gameState = state.osWaitForOpponentToPickMove({...aProps, ...playing1 });

    describe('when receiving OS_CHOSE_MOVE', () => {
      const action = actions.osMoveChosen(SingleMarks.mm);
      const updatedState = gameReducer({ messageState, gameState }, action);

      itIncreasesTurnNumBy(1, {gameState, messageState}, updatedState);
      itTransitionsTo(state.StateName.OsWaitForOpponentToPickMove, updatedState);
      itSends(playing2, updatedState);
    });

    // itHandlesResignLikeItsTheirTurn(gameState, messageState);
  });
});

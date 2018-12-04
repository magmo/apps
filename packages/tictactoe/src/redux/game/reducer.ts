import { Reducer } from 'redux';

import * as actions from './actions';
import * as states from './state';

import { MessageState } from '../message-service/state';

export interface JointState {
  gameState: states.GameState;
  messageState: MessageState;
}

const emptyJointState: JointState = { messageState: {}, gameState: states.noName({ myAddress: '', libraryAddress: '' })};

export const gameReducer: Reducer<JointState> = (state = emptyJointState, action: actions.GameAction) => {
  state = singleActionReducer(state, action);
  return state;
}

function singleActionReducer(state: JointState, action: actions.GameAction) {
  const { messageState, gameState } = state;
  switch(gameState.name){
    case states.StateName.XsPickMove: 
      if (action.type == actions.XS_MOVE_CHOSEN) {
        return xsPickMoveReducer(gameState, messageState, action)
      };
    default:
      return state;
  }
};

function xsPickMoveReducer(gameState: states.XsPickMove, messageState: MessageState, action: actions.XsMoveChosen): JointState {
  const { crosses,  turnNum } = gameState;
  let newGameState = states.xsWaitForOpponentToPickMove({...gameState, turnNum: turnNum + 1, crosses: crosses + action.crosses});
  // newGameState.crosses = gameState.crosses & action.crosses;
  // newGameState.turnNum = gameState.turnNum + 1;
  // TODO enter logic so that test passes.
  return { gameState: newGameState, messageState };
};


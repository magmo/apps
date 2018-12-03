import { Reducer } from 'redux';

// import * as actions from './actions';
import * as states from './state';

import { MessageState } from '../message-service/state';



export interface JointState {
  gameState: states.GameState;
  messageState: MessageState;
}

const emptyJointState: JointState = { messageState: {}, gameState: states.noName({ myAddress: '', libraryAddress: '' }) };

export const gameReducer: Reducer<JointState> = (state = emptyJointState, action) => {
  switch(state.gameState.name){
    case states.StateName.XsPickMove: 
      return xsPickMoveReducer(state, action);
    default:
      return state;
  }
};

export const xsPickMoveReducer: Reducer<JointState> = (state = emptyJointState, action) => {
  // const gameState = state.gameState as states.XsPickMove;
  // TODO enter logic so that test passes.
  return state;
};


import { Reducer } from 'redux';

import * as actions from './actions';
import * as states from './state';

import { positions } from '../../core';
import { MessageState, sendMessage } from '../message-service/state';

import hexToBN from '../../utils/hexToBN';
import bnToHex from '../../utils/bnToHex';


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
  const { balances, roundBuyIn, crosses,  turnNum } = gameState;
  const new_crosses = crosses + action.crosses;

  const aBal = bnToHex(hexToBN(balances[0]).sub(hexToBN(roundBuyIn)));
  const bBal = bnToHex(hexToBN(balances[1]).add(hexToBN(roundBuyIn)));
  const newBalances = [aBal, bBal] as [string, string];

  const newGameState = states.xsWaitForOpponentToPickMove({...gameState, turnNum: turnNum + 1, crosses: new_crosses});
  const opponentAddress = states.getOpponentAddress(gameState);
  const xplaying = positions.Xplaying({...newGameState, crosses: new_crosses, balances: newBalances})
  messageState = sendMessage(xplaying, opponentAddress, messageState);
  return { gameState: newGameState, messageState };
};


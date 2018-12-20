import { gameReducer, JointState } from '../reducer';
import { MessageState } from '../../message-service/state';
import { positions } from '../../../core';
import * as actions from '../actions';
import * as state from '../state';

export const itSends = (position, jointState) => {
  it(`sends ${position.name}`, () => {
    expect(jointState.messageState.opponentOutbox.position).toEqual(position);
    expect(jointState.gameState.turnNum).toEqual(position.turnNum);
  });
};

export const itIncreasesTurnNumBy = (increase: number, oldState: JointState, newState: JointState) => {
  it(`increases the turnNum by ${increase}`, () => {
    if (!('turnNum' in newState.gameState) || !('turnNum' in oldState.gameState)) {
      return fail('turnNum does not exist on one of the states');
    }
    expect(newState.gameState.turnNum).toEqual(oldState.gameState.turnNum + increase);

  });
};

export const itTransitionsTo = (stateName, jointState) => {
  it(`transitions to ${stateName}`, () => {
    expect(jointState.gameState.name).toEqual(stateName);
  });
};

export const itStoresAction = (action, jointState) => {
  it(`stores action to retry`, () => {
    expect(jointState.messageState.actionToRetry).toEqual(action);
  });
};

export const itHandlesResignLikeItsTheirTurn = (gameState: state.GameState, messageState: MessageState) => {
  describe('when the player resigns', () => {
    const updatedState = gameReducer({ gameState, messageState }, actions.resign());

    itTransitionsTo(state.StateName.WaitToResign, updatedState);
  });
};

export const itHandlesResignLikeItsMyTurn = (gameState: state.PlayingState, messageState: MessageState) => {
  describe('when the player resigns', () => {
    const { turnNum } = gameState;
    const updatedState = gameReducer({ gameState, messageState }, actions.resign());

    const newConclude = positions.conclude({ ...gameState, turnNum: turnNum + 1 });

    itTransitionsTo(state.StateName.WaitForResignationAcknowledgement, updatedState);
    itSends(newConclude, updatedState);
  });
};

export const itFullySwingsTheBalancesToA = (stake: number, oldState: JointState, newState: JointState) => {
  it(`swings the balance by ${stake}`, () => {
    if (!('balances' in newState.gameState) || !('balances' in oldState.gameState)) {
      return fail('balances does not exist on one of the states');
    }
    expect(Number(newState.gameState.balances[0])).toEqual(Number(oldState.gameState.balances[0]) + 2 * stake);
    expect(Number(newState.gameState.balances[1])).toEqual(Number(oldState.gameState.balances[1]) - 2 * stake);
  }
  );
};

export const itFullySwingsTheBalancesToB = (stake: number, oldState: JointState, newState: JointState) => {
  const negativeStake = - stake;
  itFullySwingsTheBalancesToA(negativeStake, oldState, newState);
};

export const itHalfSwingsTheBalancesToA = (stake: number, oldState: JointState, newState: JointState) => {
  const halfStake = 0.5 *  stake;
  itFullySwingsTheBalancesToA(halfStake, oldState, newState);
};

export const itHalfSwingsTheBalancesToB = (stake: number, oldState: JointState, newState: JointState) => {
  const negativeHalfStake = - 0.5 * stake;
  itFullySwingsTheBalancesToA(negativeHalfStake, oldState, newState);
};

export const itPreservesOnScreenBalances = (oldState: JointState, newState: JointState) => {
  it(`preserves the balances`, () => {
    if (!('balances' in newState.gameState) || !('balances' in oldState.gameState)) {
      return fail('balances does not exist on one of the states');
    }
    expect(Number(newState.gameState.balances[0])).toEqual(Number(oldState.gameState.balances[0]));
    expect(Number(newState.gameState.balances[1])).toEqual(Number(oldState.gameState.balances[1]));
  }
  );
};

// export const itCanHandleTheOpponentResigning = ({ gameState, messageState }) => {
//   const { turnNum } = gameState;
//   const isTheirTurn = gameState.player === Player.PlayerA ? turnNum % 2 === 0 : turnNum % 2 !== 0;
//   const newTurnNum = isTheirTurn ? turnNum : turnNum + 1;

//   const theirConclude = positions.conclude({ ...gameState, turnNum: newTurnNum });
//   const ourConclude = positions.conclude({ ...gameState, turnNum: newTurnNum + 1 });
//   const action = actions.marksReceived(theirConclude);

//   const updatedState = gameReducer({ gameState, messageState }, action);

//   itTransitionsTo(state.StateName.OpponentResigned, updatedState);
//   itSends(ourConclude, updatedState);
// };

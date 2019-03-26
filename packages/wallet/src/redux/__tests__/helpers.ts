import { ChannelStatus } from '../channelState/state';
import { StateWithSideEffects } from '../shared/state';
import { Commitment } from 'fmg-core';

export const itSendsAMessage = (state: StateWithSideEffects<ChannelStatus>) => {
  it(`sends a message`, () => {
    expect(state.sideEffects!.messageOutbox).toEqual(expect.anything());
  });
};

export const itSendsNoMessage = (state: StateWithSideEffects<ChannelStatus>) => {
  it(`sends no message`, () => {
    if (state.sideEffects) {
      expect(state.sideEffects!.messageOutbox).toBeUndefined();
    }
  });
};

export const itSendsThisMessage = (state: StateWithSideEffects<any>, message) => {
  if (message.type) {
    // We've received the entire action
    it(`sends a message`, () => {
      expectSideEffect('messageOutbox', state, message);
    });
  } else {
    // Assume we've only received the type of the message
    it(`sends message ${message}`, () => {
      expectSideEffect('messageOutbox', state, message);
    });
  }
};

export const itSendsThisDisplayEventType = (
  state: StateWithSideEffects<ChannelStatus>,
  eventType: string,
) => {
  it(`sends event ${eventType}`, () => {
    expectSideEffect('displayOutbox', state, eventType);
  });
};

const expectSideEffect = <StateType>(
  outboxBranch: string,
  state: StateWithSideEffects<StateType>,
  actionOrObject: object | string | undefined,
) => {
  const outbox = state.sideEffects![outboxBranch];
  const outboxArray = Array.isArray(outbox) ? outbox : [outbox];
  if (typeof actionOrObject === 'string') {
    expect(outboxArray).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: actionOrObject })]),
    );
  } else if (typeof actionOrObject === 'object') {
    expect(outboxArray).toEqual(expect.arrayContaining([expect.objectContaining(actionOrObject)]));
  } else if (typeof actionOrObject === 'undefined') {
    expect(outboxArray.length === 0 || outboxArray[0] === undefined).toBeTruthy();
  }
};

export const expectThisCommitmentSent = (
  state: StateWithSideEffects<ChannelStatus>,
  c: Partial<Commitment>,
) => {
  const outbox = state.sideEffects!.messageOutbox;
  const outboxArray = Array.isArray(outbox) ? outbox : [outbox];
  expect(outboxArray).toEqual(expect.arrayContaining([expect.objectContaining(c)]));
};

export const itSendsATransaction = (state: StateWithSideEffects<ChannelStatus>) => {
  it(`sends a transaction`, () => {
    expectSideEffect('transactionOutbox', state, {});
  });
};

export const itSendsThisTransaction = (state: StateWithSideEffects<any>, tx) => {
  it(`sends a transaction`, () => {
    expectSideEffect('transactionOutbox', state, tx);
  });
};

export const itSendsNoTransaction = (state: StateWithSideEffects<any>) => {
  it(`doesn't send a transaction`, () => {
    expectSideEffect('transactionOutbox', state, undefined);
    if (state.sideEffects) {
      expect(state.sideEffects.transactionOutbox).toBeUndefined();
    }
  });
};

export const itTransitionsToChannelStateType = (
  type,
  state: StateWithSideEffects<ChannelStatus>,
) => {
  it(`transitions to ${type}`, () => {
    expect(state.state.type).toEqual(type);
  });
};

export const itTransitionsToStateType = (
  type,
  stateWithSideEffects: StateWithSideEffects<{ type: any }>,
) => {
  it(`transitions to ${type}`, () => {
    expect(stateWithSideEffects.state.type).toEqual(type);
  });
};

export const itDoesntTransition = (
  oldState: ChannelStatus,
  newState: StateWithSideEffects<ChannelStatus>,
) => {
  it(`doesn't transition`, () => {
    expect(newState.state.type).toEqual(oldState.type);
  });
};

export const itIncreasesTurnNumBy = (
  increase: number,
  oldState: ChannelStatus,
  newState: StateWithSideEffects<ChannelStatus>,
) => {
  it(`increases the turnNum by ${increase}`, () => {
    if (!('turnNum' in newState.state) || !('turnNum' in oldState)) {
      fail('turnNum does not exist on one of the states');
    } else {
      expect(newState.state.turnNum).toEqual(oldState.turnNum + increase);
    }
  });
};

export const itDispatchesThisAction = (action, state: StateWithSideEffects<any>) => {
  if (action.type) {
    it(`dispatches ${action.type}`, () => {
      // The actionOutbox should only dispatch internal actions
      // We were passed the whole action
      expect(action.type).toMatch('WALLET.INTERNAL');
      expectSideEffect('actionOutbox', state, action);
    });
  } else {
    it(`dispatches ${action}`, () => {
      // We were just passed the type
      expect(action).toMatch('WALLET.INTERNAL');
      expectSideEffect('actionOutbox', state, action);
    });
  }
};

export const itDispatchesNoAction = (state: StateWithSideEffects<any>) => {
  it(`dispatches no action`, () => {
    if (state.sideEffects) {
      expectSideEffect('actionOutbox', state, undefined);
    }
  });
};

export function itChangesDepositStatusTo(status: string, state) {
  it(`changes depositStatus to ${status} `, () => {
    expect(state.state.depositStatus).toEqual(status);
  });
}
export function itChangesChannelFundingStatusTo<T extends { state: { channelFundingStatus: any } }>(
  status: string,
  state: T,
) {
  it(`changes channelFundingStatus to ${status}`, () => {
    expect(state.state.channelFundingStatus).toEqual(status);
  });
}

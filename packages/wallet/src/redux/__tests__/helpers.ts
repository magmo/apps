import { ChannelStatus } from '../channel-state/state';
import { StateWithSideEffects } from '../utils';
import { Commitment } from 'fmg-core';
import { TransactionOutboxItem, OutboxState } from '../outbox/state';
import { Initialized } from '../state';

type SideEffectState = StateWithSideEffects<any> | { outboxState: OutboxState };
export const itSendsAMessage = (state: SideEffectState) => {
  it(`sends a message`, () => {
    expectSideEffect('messageOutbox', state, item => expect(item).toEqual(expect.anything()));
  });
};

export const itSendsNoMessage = (state: SideEffectState) => {
  it(`sends no message`, () => {
    expectSideEffect('messageOutbox', state, item => expect(item).toBeUndefined());
  });
};

export const itSendsThisMessage = (state: SideEffectState, message, idx = 0) => {
  if (Array.isArray(message)) {
    message.map((m, i) => itSendsThisMessage(state, m, i));
    return;
  }

  if (message.type) {
    // We've received the entire action
    it(`sends a message`, () => {
      expectSideEffect('messageOutbox', state, item => expect(item).toMatchObject(message), idx);
    });
  } else {
    // Assume we've only received the type of the message
    it(`sends message ${message}`, () => {
      expectSideEffect('messageOutbox', state, item => expect(item.type).toEqual(message), idx);
    });
  }
};

export const itSendsThisDisplayEventType = (state: SideEffectState, eventType: string) => {
  it(`sends event ${eventType}`, () => {
    expectSideEffect('displayOutbox', state, item => expect(item.type).toEqual(eventType));
  });
};

const expectSideEffect = <StateType>(
  outboxBranch: string,
  state: SideEffectState,
  expectation: (item) => any,
  // actionOrObject: object | string | undefined,
  idx = 0,
) => {
  let outbox;
  if ('sideEffects' in state && state.sideEffects) {
    outbox = state.sideEffects[outboxBranch];
  } else if ('outboxState' in state) {
    outbox = state.outboxState[outboxBranch];
  }
  const item = Array.isArray(outbox) ? outbox[idx] : outbox;
  expectation(item);
};

export const expectThisCommitmentSent = (state: SideEffectState, c: Partial<Commitment>) => {
  expectSideEffect('messageOutbox', state, item =>
    expect(item.messagePayload.data.commitment).toMatchObject(c),
  );
};

export const itSendsATransaction = (state: SideEffectState) => {
  it(`sends a transaction`, () => {
    expectSideEffect('transactionOutbox', state, item => expect(item).toBeDefined());
  });
};

export const itSendsThisTransaction = (state: SideEffectState, tx: TransactionOutboxItem) => {
  it(`sends a transaction`, () => {
    const { transactionRequest } = tx;
    expectSideEffect('transactionOutbox', state, item =>
      expect(item).toMatchObject({ transactionRequest, channelId: expect.any(String) }),
    );
  });
};

export const itSendsNoTransaction = (state: SideEffectState) => {
  it(`doesn't send a transaction`, () => {
    expectSideEffect('transactionOutbox', state, item => expect(item).toBeUndefined());
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

// Procedure helpers
export function itTransitionsProcedureToStateType(
  procedureBranchName: string,
  state: Initialized,
  type: string,
) {
  it(`transitions the ${procedureBranchName} state to ${type}`, () => {
    expect(state[procedureBranchName].type).toEqual(type);
  });
}

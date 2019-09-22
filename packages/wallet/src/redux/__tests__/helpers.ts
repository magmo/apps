import { ChannelState, ChannelStore } from '../channel-store';
import { StateWithSideEffects } from '../utils';
import { QueuedTransaction, OutboxState, MessageOutbox } from '../outbox/state';
import { SharedData } from '../state';
import { ProtocolStateWithSharedData } from '../protocols';
import { ProtocolLocator, RelayableAction } from 'src/communication';
import _ from 'lodash';
import { State } from 'nitro-protocol/lib/src/contract/state';
import { SignedState } from 'nitro-protocol';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { Signature } from 'ethers/utils';

type SideEffectState =
  | StateWithSideEffects<any>
  | { outboxState: OutboxState }
  | { sharedData: SharedData };

const describeScenarioStep = (scenarioStep, fn) => {
  return describe(scenarioStepDescription(scenarioStep), fn);
};

describeScenarioStep.only = (scenarioStep, fn) => {
  return describe.only(scenarioStepDescription(scenarioStep), fn);
};

export { describeScenarioStep };

export function scenarioStepDescription(scenarioStep) {
  return `${scenarioStep.state.type} + \n    ${scenarioStep.action.type} =>`;
}

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

const expectSideEffect = (
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
  } else if ('sharedData' in state) {
    outbox = state.sharedData.outboxState[outboxBranch];
  }
  const item = Array.isArray(outbox) ? outbox[idx] : outbox;
  expectation(item);
};

export const expectThisMessage = (state: SideEffectState, messageType: string) => {
  expectSideEffect('messageOutbox', state, item => {
    expect(item.messagePayload.type).toEqual(messageType);
  });
};

type PartialStates = Array<{ state: Partial<State>; signature?: Signature }>;

function transformStateToMatcher(sc: { state: Partial<State>; signature?: Signature }) {
  if (sc.signature) {
    return expect.objectContaining({
      state: expect.objectContaining(sc.state),
      signature: sc.signature,
    });
  } else {
    return expect.objectContaining({ state: expect.objectContaining(sc.state) });
  }
}

export const itSendsThisState = (
  sideEffectState: SideEffectState,
  state: Partial<State>,
  type = 'WALLET.COMMON.STATES_RECEIVED',
  idx = 0,
) => {
  const messageOutbox = getOutboxState(sideEffectState, 'messageOutbox');

  it('sends a state', () => {
    try {
      // Passes when at least one message matches
      // In the case of multiple messages queued, this approach does not care about
      // their order, which is beneficial.
      // However, the diffs produced by jest are unreadable, so when this expectation fails,
      // we catch the error below
      expect(messageOutbox).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            messagePayload: expect.objectContaining({
              signedStates: transformStateToMatcher({ state }),
            }),
          }),
        ]),
      );
    } catch (err) {
      if ('matcherResult' in err) {
        // In this case, we've caught a jest expectation error.
        // We try to help the developer by using expect(foo).toMatchObject(bar)
        // The errors are much more useful in this case, but will be deceiving in the case when
        // multiple messages are queued.

        // To help with debugging, you can change the idx variable when running tests to 'search'
        // for the correct state

        console.warn(`Message not found: inspecting mismatched message in position ${idx}`);
        expect(messageOutbox[idx]).toMatchObject({
          messagePayload: {
            type,
            signedStates: { state },
          },
        });
      } else {
        throw err;
      }
    }
  });
};

export const itSendsTheseStates = (
  state: SideEffectState,
  states: PartialStates,
  type = 'WALLET.COMMON.STATES_RECEIVED',
  idx = 0,
) => {
  const messageOutbox = getOutboxState(state, 'messageOutbox');

  it('sends states', () => {
    try {
      // Passes when at least one message matches
      // In the case of multiple messages queued, this approach does not care about
      // their order, which is beneficial.
      // However, the diffs produced by jest are unreadable, so when this expectation fails,
      // we catch the error below
      expect(messageOutbox).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            messagePayload: expect.objectContaining({
              signedStates: states.map(transformStateToMatcher),
            }),
          }),
        ]),
      );
    } catch (err) {
      if ('matcherResult' in err) {
        // In this case, we've caught a jest expectation error.
        // We try to help the developer by using expect(foo).toMatchObject(bar)
        // The errors are much more useful in this case, but will be deceiving in the case when
        // multiple messages are queued.

        // To help with debugging, you can change the idx variable when running tests to 'search'
        // for the correct state
        console.warn(`Message not found: inspecting mismatched message in position ${idx}`);
        expect(messageOutbox[idx]).toMatchObject({
          messagePayload: {
            type,
            signedStates: states,
          },
        });
      } else {
        throw err;
      }
    }
  });
};

function getOutboxState(state: SideEffectState, outboxBranch: 'messageOutbox'): MessageOutbox {
  if ('sideEffects' in state && state.sideEffects && state.sideEffects[outboxBranch]) {
    return state.sideEffects[outboxBranch] as MessageOutbox;
  } else if ('outboxState' in state) {
    return state.outboxState[outboxBranch];
  } else if ('sharedData' in state) {
    return state.sharedData.outboxState[outboxBranch];
  }

  throw new Error('Invalid state');
}

export const itRelaysThisAction = (state: SideEffectState, action: RelayableAction, idx = 0) => {
  it(`relays the correct action`, () => {
    expectSideEffect(
      'messageOutbox',
      state,
      item => expect(item.messagePayload).toMatchObject(action),
      idx,
    );
  });
};

export const itSendsATransaction = (state: SideEffectState) => {
  it(`sends a transaction`, () => {
    expectSideEffect('transactionOutbox', state, item => expect(item).toBeDefined());
  });
};

export const itSendsThisTransaction = (state: SideEffectState, tx: QueuedTransaction) => {
  it(`sends a transaction`, () => {
    const { transactionRequest } = tx;
    expectSideEffect('transactionOutbox', state, item =>
      expect(item).toMatchObject({
        transactionRequest,
        processId: expect.any(String),
      }),
    );
  });
};

export const itSendsNoTransaction = (state: SideEffectState) => {
  it(`doesn't send a transaction`, () => {
    expectSideEffect('transactionOutbox', state, item => expect(item).toBeUndefined());
  });
};

export const itTransitionsToStateType = (
  type,
  protocolStateWithSharedData: ProtocolStateWithSharedData<{ type: any }>,
) => {
  it(`transitions to ${type}`, () => {
    expect(protocolStateWithSharedData.protocolState.type).toEqual(type);
  });
};

export const itIncreasesTurnNumBy = (
  increase: number,
  oldState: ChannelState,
  newState: StateWithSideEffects<ChannelState>,
) => {
  it(`increases the turnNum by ${increase}`, () => {
    if (!('turnNumRecord' in newState.state) || !('turnNumRecord' in oldState)) {
      fail('turnNumRecord does not exist on one of the states');
    } else {
      expect(newState.state.turnNumRecord).toEqual(oldState.turnNumRecord + increase);
    }
  });
};

export const itStoresThisState = (
  state: { channelStore: ChannelStore },
  signedState: SignedState,
) => {
  it('stores the state in the channel state', () => {
    const channelId = getChannelId(signedState.state.channel);
    const channelState = state.channelStore[channelId];
    const lastSignedState = channelState.signedStates.slice(-1)[0];
    expect(lastSignedState).toMatchObject(signedState);
  });
};

export const itRegistersThisChannel = (
  state: SharedData,
  channelId: string,
  processId: string,
  protocolLocator: ProtocolLocator,
) => {
  it('subscribes to channel events in the channel subscriptions', () => {
    const subscriptionState = state.channelSubscriptions[channelId];
    expect(subscriptionState).toContainEqual({ protocolLocator, processId });
  });
};

export const mergeSharedData = (
  firstSharedData: SharedData,
  secondSharedData: SharedData,
): SharedData => {
  return _.merge({}, firstSharedData, secondSharedData);
};

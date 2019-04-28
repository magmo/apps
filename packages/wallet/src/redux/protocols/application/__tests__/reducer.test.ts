import * as scenarios from './scenarios';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { itSendsThisMessage } from '../../../__tests__/helpers';

function whenIn(state) {
  return `when in ${state}`;
}

function reducer(state, sharedData, action) {
  return { protocolState: state, sharedData };
}

describe('initializing the application', () => {
  const scenario = scenarios.receivingOurCommitment;
  const sharedData = scenario.storage;

  describe(whenIn(states.ONGOING), () => {
    const state = scenario.states.ongoing;
    const action = scenario.actions.receiveOurCommitment;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.ONGOING);
  });
});

describe('starting the application', () => {
  const scenario = scenarios.startingApplication;
  const sharedData = scenario.storage;

  describe(whenIn(states.ADDRESS_KNOWN), () => {
    const state = scenario.states.addressKnown;
    const action = scenario.actions.receivePreFundSetup;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.ONGOING);
    itSendsThisMessage(result, 'VALIDATION SUCCESS');
  });
});

describe('signing a commitment', () => {
  const scenario = scenarios.receivingOurCommitment;
  const sharedData = scenario.storage;

  describe(whenIn(states.ADDRESS_KNOWN), () => {
    const state = scenario.states.ongoing;
    const action = scenario.actions.receiveOurCommitment;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.ONGOING);
    itSendsThisMessage(result, 'SIGNATURE SUCCESS');
  });
});

describe('validating a commitment', () => {
  const scenario = scenarios.receivingTheirCommitment;
  const sharedData = scenario.storage;

  describe(whenIn(states.ADDRESS_KNOWN), () => {
    const state = scenario.states.ongoing;
    const action = scenario.actions.receiveTheirCommitment;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.ONGOING);
    itSendsThisMessage(result, 'VALIDATION SUCCESS');
  });
});

function itTransitionsTo(
  result: ProtocolStateWithSharedData<states.ApplicationState>,
  type: string,
) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}

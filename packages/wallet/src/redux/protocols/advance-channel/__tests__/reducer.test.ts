import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import {
  itSendsTheseStates,
  itRegistersThisChannel,
  itSendsNoMessage,
  itStoresThisState,
} from '../../../__tests__/helpers';

const itTransitionsTo = (
  result: states.AdvanceChannelState,
  type: states.AdvanceChannelStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};

describe('sending preFundSetup as A', () => {
  const scenario = scenarios.newChannelAsA;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsTheseStates(result, signedStates);
    itStoresThisState(result, signedStates[0]);
    itRegistersThisChannel(result, channelId, processId, args.protocolLocator);
  });

  describe('when receiving prefund signedStates from b', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[1]);
  });

  describe('when receiving prefund signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending conclude as A', () => {
  const scenario = scenarios.concludingAsA;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsTheseStates(result, signedStates);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving conclude signedStates from b', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving conclude signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending conclude as B', () => {
  const scenario = scenarios.concludingAsB;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
  });

  describe('when receiving conclude signedStates from a', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');

    itSendsTheseStates(result, signedStates);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving conclude signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending conclude as hub', () => {
  const scenario = scenarios.concludingAsHub;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
  });

  describe('when receiving conclude signedStates from a', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving conclude signedStates from b', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromB;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsTheseStates(result, signedStates);
  });
});

describe('sending preFundSetup as B', () => {
  const scenario = scenarios.newChannelAsB;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itSendsNoMessage(result);
  });

  describe('when receiving prefund signedStates from A', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itStoresThisState(result, signedStates[1]);
    itSendsTheseStates(result, signedStates);
    itRegistersThisChannel(result, channelId, processId, scenario.protocolLocator);
  });

  describe('when receiving prefund signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending preFundSetup as Hub', () => {
  const scenario = scenarios.newChannelAsHub;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itSendsNoMessage(result);
  });

  describe('when receiving prefund signedStates from A', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itStoresThisState(result, signedStates[0]);
    itSendsNoMessage(result);
  });

  describe('when receiving prefund signedStates from B', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsTheseStates(result, signedStates);
    itRegistersThisChannel(result, channelId, processId, scenario.protocolLocator);
  });
});

describe('sending postFundSetup as A', () => {
  const scenario = scenarios.existingChannelAsA;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsTheseStates(result, signedStates);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving postFund signedStates from b', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving postfund signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending postFundSetup as B', () => {
  const scenario = scenarios.existingChannelAsB;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving a PostFund commitment from A', () => {
    const { signedStates, state, sharedData, action } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsTheseStates(result, signedStates);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving postfund signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsNoMessage(result);
  });
});

describe('sending postFundSetup as Hub', () => {
  const scenario = scenarios.existingChannelAsHub;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
  });

  describe('when receiving postfund signedStates from the hub', () => {
    const { state, sharedData, action, signedStates } = scenario.receiveFromB;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisState(result, signedStates[2]);
    itSendsTheseStates(result, signedStates);
  });
});

describe('when not cleared to send', () => {
  const scenario = scenarios.notClearedToSend;

  describe('when initializing', () => {
    const { sharedData, signedStates, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itSendsNoMessage(result);
    itStoresThisState(result, signedStates[2]);
    itIsNotClearedToSend(protocolState);
  });

  describe('when cleared to send, and it is safe to send', () => {
    const { state, sharedData, action, signedStates } = scenario.clearedToSend;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itStoresThisState(result, signedStates[2]);
    itSendsTheseStates(result, signedStates);
  });

  describe('when cleared to send, and it is unsafe to send', () => {
    const { state, sharedData, action, signedStates } = scenario.clearedToSendButUnsafe;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.NotSafeToSend');
    itStoresThisState(result, signedStates[1]);
    itSendsNoMessage(result);
    itIsClearedToSend(protocolState);
  });

  describe('when cleared to send, and the channel is unknown', () => {
    const { state, sharedData, action } = scenario.clearedToSendButChannelUnknown;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itSendsNoMessage(result);
    itIsClearedToSend(protocolState);
  });

  describe('when cleared to send, but the commitment was already sent', () => {
    const { state, sharedData, action } = scenario.clearedToSendAndAlreadySent;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
  });
});

function itIsClearedToSend(protocolState: states.AdvanceChannelState) {
  it('is cleared to send', () => {
    expect(protocolState).toMatchObject({ clearedToSend: true });
  });
}

function itIsNotClearedToSend(protocolState: states.AdvanceChannelState) {
  it('is cleared to send', () => {
    expect(protocolState).toMatchObject({ clearedToSend: false });
  });
}

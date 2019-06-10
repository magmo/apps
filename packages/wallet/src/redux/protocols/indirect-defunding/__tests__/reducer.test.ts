import * as scenarios from './scenarios';
import { IndirectDefundingState, IndirectDefundingStateType } from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { getLastMessage, SharedData } from '../../../state';
import { SignedCommitment } from '../../../../domain';
import { initialize, indirectDefundingReducer } from '../reducer';
import {
  describeScenarioStep,
  itSendsAnInternalMessage,
} from '../../../../redux/__tests__/helpers';

const itYieldsToPreviousProcess = (oldSharedData: SharedData, newSharedData: SharedData) => {
  it(`yields to the previous process`, () => {
    expect(newSharedData.currentProcessId).toEqual(oldSharedData.yieldingProcessId);
  });
};

describe('player A happy path', () => {
  const scenario = scenarios.playerAHappyPath;
  const {
    processId,
    channelId,
    ledgerId,
    store,
    proposedAllocation,
    proposedDestination,
  } = scenario.initialParams;

  describe('when initializing', () => {
    const result = initialize(
      processId,
      channelId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      store,
    );
    itTransitionsTo(result, 'IndirectDefunding.ConfirmLedgerUpdate');
  });

  describe('(ledger update)', () => {
    describeScenarioStep(scenario.confirmLedgerUpdate0, () => {
      const { state, action, reply } = scenario.confirmLedgerUpdate0;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.WaitForLedgerUpdate');
      itSendsMessage(updatedState, reply);
    });
  });

  describe('(ledger update)', () => {
    describeScenarioStep(scenario.waitForLedgerUpdate1, () => {
      const { state, action } = scenario.waitForLedgerUpdate1;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.ConfirmLedgerUpdate');
    });
  });

  describe('(conclude)', () => {
    describeScenarioStep(scenario.confirmConclude, () => {
      const { state, action, reply } = scenario.confirmConclude;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.WaitForLedgerUpdate');
      itSendsMessage(updatedState, reply);
    });
  });

  describe('(conclude)', () => {
    describeScenarioStep(scenario.waitForConclude, () => {
      const { state, action } = scenario.waitForConclude;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain');
    });
  });

  describeScenarioStep(scenario.acknowledgeLedgerFinalizedOffChain, () => {
    const { state, action } = scenario.acknowledgeLedgerFinalizedOffChain;
    const updatedState = indirectDefundingReducer(state.state, state.store, action);
    itTransitionsTo(updatedState, 'IndirectDefunding.FinalizedOffChain');
  });
});

describe('player B happy path', () => {
  const scenario = scenarios.playerBHappyPath;
  const {
    processId,
    channelId,
    ledgerId,
    store,
    proposedAllocation,
    proposedDestination,
  } = scenario.initialParams;

  describe('when initializing', () => {
    const result = initialize(
      processId,
      channelId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      store,
    );
    itTransitionsTo(result, 'IndirectDefunding.WaitForLedgerUpdate');
  });

  describe('(ledger update)', () => {
    describeScenarioStep(scenario.waitForLedgerUpdate0, () => {
      const { state, action } = scenario.waitForLedgerUpdate0;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.ConfirmLedgerUpdate');
    });
  });

  describe('(ledger update)', () => {
    describeScenarioStep(scenario.confirmLedgerUpdate1, () => {
      const { state, action, reply } = scenario.confirmLedgerUpdate1;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.WaitForLedgerUpdate');
      itSendsMessage(updatedState, reply);
    });
  });

  describe('(conclude)', () => {
    describeScenarioStep(scenario.waitForConclude, () => {
      const { state, action } = scenario.waitForConclude;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.ConfirmLedgerUpdate');
    });
  });

  describe('(conclude)', () => {
    describeScenarioStep(scenario.confirmConclude, () => {
      const { state, action, reply } = scenario.confirmConclude;
      const updatedState = indirectDefundingReducer(state.state, state.store, action);
      itTransitionsTo(updatedState, 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain');
      itSendsMessage(updatedState, reply);
    });
  });

  describeScenarioStep(scenario.acknowledgeLedgerFinalizedOffChain, () => {
    const { state, action } = scenario.acknowledgeLedgerFinalizedOffChain;
    const updatedState = indirectDefundingReducer(state.state, state.store, action);
    itTransitionsTo(updatedState, 'IndirectDefunding.FinalizedOffChain');
  });
});

describe('player B ledger challenge', () => {
  const scenario = scenarios.playerBLedgerChallenge;

  describeScenarioStep(scenario.waitForLedgerUpdate0, () => {
    const { state, action } = scenario.waitForLedgerUpdate0;
    const updatedState = indirectDefundingReducer(state.state, state.store, action);
    itTransitionsTo(updatedState, 'IndirectDefunding.ConfirmLedgerUpdate');
    itSendsAnInternalMessage(updatedState.sharedData); // WALLET.NEW_PROCESS.CREATE_CHALLENGE_REQUESTED
  });
});

describe('player A ledger challenge', () => {
  const scenario = scenarios.playerALedgerChallenge;

  describeScenarioStep(scenario.confirmLedgerUpdate0, () => {
    const { state, action } = scenario.confirmLedgerUpdate0;
    const updatedState = indirectDefundingReducer(state.state, state.store, action);
    itTransitionsTo(updatedState, 'IndirectDefunding.ConfirmLedgerUpdate');
    expect(updatedState.protocolState).toHaveProperty('isRespondingToChallenge', true);
  });

  describeScenarioStep(scenario.confirmLedgerUpdate0Respond, () => {
    const { state, action } = scenario.confirmLedgerUpdate0Respond;
    const updatedState = indirectDefundingReducer(state.state, state.store, action);
    itTransitionsTo(updatedState, 'IndirectDefunding.WaitForLedgerUpdate');
    itSendsAnInternalMessage(updatedState.sharedData); // WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED
    itYieldsToPreviousProcess(state.store, updatedState.sharedData);
  });
});

// describe('player B invalid commitment', () => {
//   const scenario = scenarios.playerBInvalidCommitment;

//   describe('when in WaitForLedgerUpdate', () => {
//     const { state, action } = scenario.waitForLedgerUpdate;
//     const updatedState = indirectDefundingReducer(state.state, state.store, action);
//     itTransitionsTo(updatedState, 'IndirectDefunding.Failure');
//   });
// });

// describe('not defundable', () => {
//   const scenario = scenarios.notDefundable;
//   const {
//     processId,
//     channelId,
//     ledgerId,
//     store,
//     proposedAllocation,
//     proposedDestination,
//   } = scenario.initialParams;
//   describe('when initializing', () => {
//     const result = initialize(
//       processId,
//       channelId,
//       ledgerId,
//       proposedAllocation,
//       proposedDestination,
//       store,
//     );
//     itTransitionsTo(result, 'IndirectDefunding.Failure');
//   });
// });

type ReturnVal = ProtocolStateWithSharedData<IndirectDefundingState>;
function itTransitionsTo(state: ReturnVal, type: IndirectDefundingStateType) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function itSendsMessage(state: ReturnVal, message: SignedCommitment) {
  it('sends a message', () => {
    const lastMessage = getLastMessage(state.sharedData);
    if (lastMessage && 'messagePayload' in lastMessage) {
      const dataPayload = lastMessage.messagePayload;
      // This is yuk. The data in a message is currently of 'any' type..
      if (!('signedCommitment' in dataPayload)) {
        fail('No signedCommitment in the last message.');
      }
      const { commitment, signature } = dataPayload.signedCommitment;
      expect({ commitment, signature }).toEqual(message);
    } else {
      fail('No messages in the outbox.');
    }
  });
}

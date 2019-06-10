import * as scenarios from './scenarios';
import { initialize, responderReducer } from '../reducer';

import * as states from '../states';
import { Commitment } from '../../../../../domain';
import * as TransactionGenerator from '../../../../../utils/transaction-generator';
import { describeScenarioStep, itSendsAnInternalMessage } from '../../../../__tests__/helpers';
import { SharedData } from 'src/redux/state';

// Mocks
const mockTransaction = { to: '0xabc' };
const createRespondWithMoveMock = jest.fn().mockReturnValue(mockTransaction);
const refuteMock = jest.fn().mockReturnValue(mockTransaction);
Object.defineProperty(TransactionGenerator, 'createRespondWithMoveTransaction', {
  value: createRespondWithMoveMock,
});
Object.defineProperty(TransactionGenerator, 'createRefuteTransaction', {
  value: refuteMock,
});

// helpers

// const itTransitionsToFailure = (
//   result: { protocolState: states.ResponderState },
//   failure: states.Failure,
// ) => {
//   it(`transitions to failure with reason ${failure.reason}`, () => {
//     expect(result.protocolState).toMatchObject(failure);
//   });
// };

const itCallsRespondWithMoveWith = (challengeCommitment: Commitment) => {
  it('calls respond with move with the correct commitment', () => {
    expect(createRespondWithMoveMock).toHaveBeenCalledWith(
      challengeCommitment,
      jasmine.any(String),
    );
  });
};

// const itCallsRefuteWith = (refuteCommitment: Commitment) => {
//   it('calls refute with the correct commitment', () => {
//     expect(refuteMock).toHaveBeenCalledWith(refuteCommitment, jasmine.any(String));
//   });
// };

const itTransitionsTo = (
  result: { protocolState: states.ResponderState },
  type: states.ResponderStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

const itSetsChallengeCommitment = (
  result: { protocolState: states.ResponderState },
  commitment: Commitment,
) => {
  it('sets the correct challenge commitment', () => {
    expect((result.protocolState as states.WaitForApproval).challengeCommitment).toMatchObject(
      commitment,
    );
  });
};

const itDoesNotSendADisplayMessage = (oldSharedData: SharedData, newSharedData: SharedData) => {
  it(`Does not send a display message`, () => {
    expect(newSharedData.outboxState.displayOutbox).toEqual(
      oldSharedData.outboxState.displayOutbox,
    );
  });
};

const itDoesNotSendAMessageToTheApp = (oldSharedData: SharedData, newSharedData: SharedData) => {
  it(`Does not send a message to the app`, () => {
    expect(newSharedData.outboxState.messageOutbox).toEqual(
      oldSharedData.outboxState.messageOutbox,
    );
  });
};

const itYieldsToPreviousProcess = (oldSharedData: SharedData, newSharedData: SharedData) => {
  it(`Yields to the previous process`, () => {
    expect(newSharedData.currentProcessId).toEqual(oldSharedData.yieldingProcessId);
  });
};

// Only test the behavior that differs when handling a ledger challenge

// describe('RESPOND WITH EXISTING MOVE HAPPY-PATH', () => {
//   const scenario = scenarios.respondWithExistingCommitmentHappyPath;
//   const { sharedData, processId, channelId } = scenario;

//   describe('when initializing', () => {
//     const { challengeCommitment, expiryTime } = scenario;
//     const result = initialize(processId, channelId, expiryTime, sharedData, challengeCommitment);

//     itTransitionsTo(result, 'Responding.WaitForApproval');
//     itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
//     itSetsChallengeCommitment(result, challengeCommitment);
//   });

//   describeScenarioStep(scenario.waitForApproval, () => {
//     const { state, action, responseCommitment } = scenario.waitForApproval;
//     const result = responderReducer(state, sharedData, action);

//     itTransitionsTo(result, 'Responding.WaitForTransaction');
//     itCallsRespondWithMoveWith(responseCommitment);
//   });

//   describeScenarioStep(scenario.waitForTransaction, () => {
//     const { state, action } = scenario.waitForTransaction;

//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
//   });

//   describeScenarioStep(scenario.waitForAcknowledgement, () => {
//     const { state, action } = scenario.waitForAcknowledgement;

//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.Success');
//   });
// });

// describe('REFUTE HAPPY-PATH ', () => {
//   const scenario = scenarios.refuteHappyPath;
//   const { sharedData, processId, channelId } = scenario;

//   describe('when initializing', () => {
//     const { challengeCommitment, expiryTime } = scenario;
//     const result = initialize(processId, channelId, expiryTime, sharedData, challengeCommitment);

//     itTransitionsTo(result, 'Responding.WaitForApproval');
//     itSetsChallengeCommitment(result, scenario.challengeCommitment);
//   });

//   describeScenarioStep(scenario.waitForApproval, () => {
//     const { state, action, refuteCommitment } = scenario.waitForApproval;

//     const result = responderReducer(state, sharedData, action);

//     itTransitionsTo(result, 'Responding.WaitForTransaction');
//     itCallsRefuteWith(refuteCommitment);
//   });

//   describeScenarioStep(scenario.waitForTransaction, () => {
//     const { state, action } = scenario.waitForTransaction;

//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
//   });

//   describeScenarioStep(scenario.waitForAcknowledgement, () => {
//     const { state, action } = scenario.waitForAcknowledgement;

//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.Success');
//   });
// });

describe('REQUIRE RESPONSE HAPPY-PATH ', () => {
  const scenario = scenarios.requireResponseHappyPath;
  const { sharedData, processId, channelId, expiryTime } = scenario;
  sharedData.yieldingProcessId = 'Concluding-0xsomechannelid'; // will trigger ledger dispute behavior

  describe('when initializing', () => {
    const result = initialize(
      processId,
      channelId,
      expiryTime,
      sharedData,
      scenario.challengeCommitment,
    );
    itTransitionsTo(result, 'Responding.WaitForApproval');
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
    itDoesNotSendADisplayMessage(sharedData, result.sharedData);
    itDoesNotSendAMessageToTheApp(sharedData, result.sharedData);
    // TODO registers a channel to monitor
  });

  describeScenarioStep(scenario.waitForApprovalRequiresResponse, () => {
    const { state, action } = scenario.waitForApprovalRequiresResponse;
    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForResponse');
    itDoesNotSendADisplayMessage(sharedData, result.sharedData);
    itSendsAnInternalMessage(result.sharedData); // 'WALLET.COMMON.LEDGER_DISPUTE_DETECTED'
    itYieldsToPreviousProcess(sharedData, result.sharedData);
  });

  describeScenarioStep(scenario.waitForResponse, () => {
    const { state, action, responseCommitment } = scenario.waitForResponse;
    const result = responderReducer(state, sharedData, action);
    itDoesNotSendADisplayMessage(sharedData, result.sharedData);
    itTransitionsTo(result, 'Responding.WaitForTransaction');
    itCallsRespondWithMoveWith(responseCommitment);
  });

  describeScenarioStep(scenario.waitForTransaction, () => {
    const { state, action } = scenario.waitForTransaction;
    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
  });

  describeScenarioStep(scenario.waitForAcknowledgement, () => {
    const { state, action } = scenario.waitForAcknowledgement;
    const result = responderReducer(state, sharedData, action);
    itDoesNotSendADisplayMessage(sharedData, result.sharedData);
    itDoesNotSendAMessageToTheApp(sharedData, result.sharedData);
    itYieldsToPreviousProcess(sharedData, result.sharedData);
    itTransitionsTo(result, 'Responding.Success');
  });
});

// describe('TRANSACTION FAILED ', () => {
//   const scenario = scenarios.transactionFails;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.waitForTransaction, () => {
//     const { state, action } = scenario.waitForTransaction;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsToFailure(result, scenario.failure);
//   });
// });

// describe('CHALLENGE EXPIRES --> DEFUNDED', () => {
//   const scenario = scenarios.challengeExpiresChannelDefunded;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.waitForResponse, () => {
//     const { state, action } = scenario.waitForResponse;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
//     itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
//   });

//   describeScenarioStep(scenario.acknowledgeTimeout, () => {
//     const { state, action } = scenario.acknowledgeTimeout;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.WaitForDefund');
//   });

//   describeScenarioStep(scenario.waitForDefund1, () => {
//     const { state, action } = scenario.waitForDefund1;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.AcknowledgeDefundingSuccess');
//   });

//   describeScenarioStep(scenario.acknowledgeDefundingSuccess, () => {
//     const { state, action } = scenario.acknowledgeDefundingSuccess;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.ClosedAndDefunded');
//   });
// });

// describe('CHALLENGE EXPIRES --> not DEFUNDED', () => {
//   const scenario = scenarios.challengeExpiresButChannelNotDefunded;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.waitForDefund2, () => {
//     const { state, action } = scenario.waitForDefund2;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.AcknowledgeClosedButNotDefunded');
//   });

//   describeScenarioStep(scenario.acknowledgeClosedButNotDefunded, () => {
//     const { state, action } = scenario.acknowledgeClosedButNotDefunded;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.ClosedButNotDefunded');
//   });
// });

// describe('CHALLENGE EXPIRES when in WaitForTransaction', () => {
//   const scenario = scenarios.challengeExpiresDuringWaitForTransaction;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.waitForTransaction, () => {
//     const { state, action } = scenario.waitForTransaction;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
//   });
// });

// describe('CHALLENGE EXPIRES when in WaitForApproval', () => {
//   const scenario = scenarios.challengeExpiresDuringWaitForApproval;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.waitForApprovalRespond, () => {
//     const { state, action } = scenario.waitForApprovalRespond;
//     const result = responderReducer(state, sharedData, action);
//     itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
//   });
// });

// describe('DEFUND ACTION arrives in ACKNOWLEDGE_TIMEOUT', () => {
//   const scenario = scenarios.defundActionComesDuringAcknowledgeTimeout;
//   const { sharedData } = scenario;

//   describeScenarioStep(scenario.acknowledgeTimeout, () => {
//     const { state, action } = scenario.acknowledgeTimeout;

//     const result = responderReducer(state, sharedData, action);
//     // TODO: Is this the correct state?
//     itTransitionsTo(result, 'Responding.AcknowledgeClosedButNotDefunded');
//   });
// });

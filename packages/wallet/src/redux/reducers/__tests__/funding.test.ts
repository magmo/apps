import { fundingReducer } from '../channels/funding';

import * as states from '../../states/channels';
import * as fundingStates from '../../states/channels/funding/index';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import {
  itTransitionsToChannelStateType,
  itIncreasesTurnNumBy,
  itSendsThisMessage,
  // expectThisCommitmentSent,
  itTransitionsToStateType,
  expectThisCommitmentSent,
} from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import * as SigningUtil from '../../../utils/signing-utils';
import * as fmgCore from 'fmg-core';
import { bigNumberify } from 'ethers/utils';
import { NextChannelState } from '../../states/shared';
import {
  WAIT_FOR_FUNDING_REQUEST,
  WaitForFundingRequest,
} from '../../states/channels/funding/index';
import { DIRECT_FUNDING } from '../../states/channels/funding/shared';

const {
  asAddress,
  asPrivateKey,
  bsPrivateKey,
  channelNonce,
  libraryAddress,
  participants,
  preFundCommitment1,
  preFundCommitment2,
  postFundCommitment1,
  postFundCommitment2,
  // bsAddress,
  channelId,
} = scenarios;
const TX = '1234';

const unknownFundingState: WaitForFundingRequest = {
  type: WAIT_FOR_FUNDING_REQUEST,
  fundingType: fundingStates.UNKNOWN_FUNDING_TYPE,
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
  requestedYourContribution: bigNumberify(0).toHexString(),
};
const directFundingState: fundingStates.DirectFundingState = {
  type: fundingStates.WAIT_FOR_FUNDING_APPROVAL,
  fundingType: DIRECT_FUNDING,
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
  requestedYourContribution: bigNumberify(0).toHexString(),
};
const fundingStateWithTx = { ...directFundingState, transactionHash: TX };

const defaults = {
  address: asAddress,
  adjudicator: 'adj-address',
  channelId,
  channelNonce,
  libraryAddress,
  networkId: 3,
  participants,
  uid: 'uid',
  transactionHash: '0x0',
  fundingState: directFundingState,
  funded: false,
};

const A_CONTRIBUTION = 400000000000000;
const defaultsA = {
  ...defaults,
  ourIndex: 0,
  privateKey: asPrivateKey,
  fundingState: {
    ...defaults.fundingState,
    requestedYourContribution: bigNumberify(A_CONTRIBUTION).toHexString(),
  },
};

const B_CONTRIBUTION = 600000000000000;
const defaultsB = {
  ...defaults,
  ourIndex: 1,
  privateKey: bsPrivateKey,
  fundingState: {
    ...defaults.fundingState,
    requestedYourContribution: bigNumberify(B_CONTRIBUTION).toHexString(),
  } as fundingStates.DirectFundingState,
};

const justReceivedPreFundSetupB = {
  penultimateCommitment: { commitment: preFundCommitment1, signature: 'sig' },
  lastCommitment: { commitment: preFundCommitment2, signature: 'sig' },
  turnNum: 1,
};

const justReceivedPostFundSetupA = {
  penultimateCommitment: { commitment: preFundCommitment2, signature: 'sig' },
  lastCommitment: { commitment: postFundCommitment1, signature: 'sig' },
  turnNum: 2,
  funded: true,
};

const justReceivedPostFundSetupB = {
  penultimateCommitment: { commitment: postFundCommitment1, signature: 'sig' },
  lastCommitment: { commitment: postFundCommitment2, signature: 'sig' },
  turnNum: 3,
  funded: true,
};

describe('start in WaitForFundingRequest', () => {
  describe('action taken: funding requested', () => {
    // player A scenario
    const testDefaults = {
      ...defaultsA,
      ...justReceivedPreFundSetupB,
      fundingState: unknownFundingState,
    };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
    itTransitionsFundingStateToType(fundingStates.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });

  describe('action taken: funding requested', () => {
    // player B scenario
    const testDefaults = {
      ...defaultsB,
      ...justReceivedPreFundSetupB,
      fundingState: { ...unknownFundingState },
    };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
    itTransitionsFundingStateToType(fundingStates.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });
});

describe('start in WaitForFundingApproval', () => {
  const createDeployTxMock = jest.fn(() => TX);
  Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
    value: createDeployTxMock,
  });
  describe('incoming action: funding approved', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingApproved();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    expect(createDeployTxMock.mock.calls.length).toBe(1);
    // expect(createDeployTxMock.mock.calls[0][2]).toBe(state.lastCommitment.commitment.allocation[0]);
  });

  describe('incoming action: funding rejected', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingRejected();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.SEND_FUNDING_DECLINED_MESSAGE, updatedState);
  });

  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
});

function justReceivedPreFundSetupBState(fundingState) {
  const params = { ...defaultsA, ...justReceivedPreFundSetupB, fundingState };
  return states.waitForFundingAndPostFundSetup(params);
}

describe.skip('start in WaitForFundingAndPostFundSetup', () => {
  describe('incoming action: deposit submitted', () => {
    // player A scenario
    const fundingState = fundingStates.aSubmitDepositInMetaMask(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    itTransitionsFundingStateToType(fundingStates.A_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player A scenario
    const fundingState = fundingStates.aSubmitDepositInMetaMask(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    itTransitionsFundingStateToType(fundingStates.A_DEPOSIT_TRANSACTION_FAILED, updatedState);
  });

  describe('incoming action: transaction confirmed', () => {
    // player A scenario
    const fundingState = fundingStates.aWaitForDepositConfirmation(fundingStateWithTx);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionConfirmed(TX);
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    itTransitionsFundingStateToType(fundingStates.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState);
  });
  describe('incoming action: Funding declined message received', () => {
    const fundingState = fundingStates.aWaitForDepositConfirmation(fundingStateWithTx);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });

  describe('incoming action: Funding declined message received', () => {
    const fundingState = fundingStates.aWaitForOpponentDeposit(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
  describe('incoming action: funding received event', () => {
    // player A scenario
    const fundingState = fundingStates.aWaitForOpponentDeposit(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.fundingReceivedEvent('0xf00', '0x100', '0x100');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });

  describe('incoming action: funding received event', () => {
    // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingConfirmation(testDefaults);
    const action = actions.fundingReceivedEvent(channelId, '0x2', '0x02');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.waitForFundingConfirmation, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
    expect(createDepositTxMock.mock.calls[0][1]).toBe(
      state.lastCommitment.commitment.allocation[1],
    );
  });
  describe('incoming action: transaction sent to metamask', () => {
    // player B scenario
    const fundingState = fundingStates.bWaitForDepositToBeSentToMetaMask(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionSentToMetamask();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
  });

  describe('incoming action: transaction submitted', () => {
    // player B scenario
    const fundingState = fundingStates.bSubmitDepositInMetaMask(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player B scenario
    const fundingState = fundingStates.bSubmitDepositInMetaMask(directFundingState);
    const state = justReceivedPreFundSetupBState(fundingState);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
  });

  // describe('incoming action: deposit confirmed', () => {
  //   // player B scenario
  //   const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
  //   const state = states.bWaitForDepositConfirmation(testDefaults);
  //   const action = actions.transactionConfirmed();
  //   const updatedState = fundingReducer(state, action);

  //   itTransitionsToChannelStateType(states.B_WAIT_FOR_POST_FUND_SETUP, updatedState);
  //   itIncreasesTurnNumBy(0, state, updatedState);
  // });

  // describe('incoming action: deposit confirmed, postFundA already received', () => {
  //   // player B scenario
  //   const validateMock = jest.fn().mockReturnValue(true);
  //   Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

  //   const testDefaults = {
  //     ...defaultsB,
  //     ...justReceivedPreFundSetupB,
  //   };
  //   const unhandledAction = actions.commitmentReceived(postFundCommitment1, '0x0');
  //   const state = states.bWaitForDepositConfirmation(testDefaults);
  //   const action = actions.transactionConfirmed();
  //   const updatedState = fundingReducer(state, action, unhandledAction);

  //   itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
  //   itIncreasesTurnNumBy(2, state, updatedState);
  // });
  //   describe('incoming action: message received', () => {
  //     // player B scenario
  //     const validateMock = jest.fn().mockReturnValue(true);
  //     Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

  //     const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
  //     const state = states.bWaitForDepositConfirmation(testDefaults);
  //     const action = actions.commitmentReceived(postFundCommitment2, '0x0');
  //     const updatedState = fundingReducer(state, action);

  //     itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  //     itIncreasesTurnNumBy(0, state, updatedState);
  //     it('works', async () => {
  //       expect(
  //         (updatedState as NextChannelState<states.BWaitForDepositConfirmation>).unhandledAction,
  //       ).toEqual(action);
  //     });
  //   });
  //   describe('incoming action: retry transaction', () => {
  //     const createDepositTxMock = jest.fn();
  //     Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
  //       value: createDepositTxMock,
  //     });
  //     const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
  //     const state = states.bDepositTransactionFailed(testDefaults);
  //     const action = actions.retryTransaction();
  //     const updatedState = fundingReducer(state, action);

  //     itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
  //     expect(createDepositTxMock.mock.calls.length).toBe(1);
  //   });
  //   describe('incoming action: retry transaction', () => {
  //     const createDeployTxMock = jest.fn();
  //     Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
  //       value: createDeployTxMock,
  //     });
  //     const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
  //     const state = states.aDepositTransactionFailed(testDefaults);
  //     const action = actions.retryTransaction();
  //     const updatedState = fundingReducer(state, action);

  //     itTransitionsToChannelStateType(states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
  //     expect(createDeployTxMock.mock.calls.length).toBe(1);
  //   });
  //   describe('incoming action: depositSentToMetamask', () => {
  //     // player A scenario
  //     const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
  //     const state = states.aWaitForDepositToBeSentToMetaMask(testDefaults);
  //     const action = actions.transactionSentToMetamask();
  //     const updatedState = fundingReducer(state, action);

  //     itTransitionsToChannelStateType(states.A_SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  //   });
  //   describe('incoming action: Funding declined message received', () => {
  //     const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
  //     const state = states.aWaitForDepositToBeSentToMetaMask(testDefaults);
  //     const action = actions.messageReceived('FundingDeclined');
  //     const updatedState = fundingReducer(state, action);
  //     itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  //   });
});

describe('start in SendFundingDeclinedMessage', () => {
  describe('incoming action: message sent', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.sendFundingDeclinedMessage(testDefaults);
    const action = actions.messageSent();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_CHANNEL, updatedState);
    itSendsThisMessage(updatedState, outgoing.FUNDING_FAILURE);
  });
});

describe('start in AWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => {
    // player A scenario
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupA };
    const state = states.aWaitForPostFundSetup(testDefaults);
    const action = actions.commitmentReceived(postFundCommitment2, 'sig');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
  });
});

describe('start in BWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForPostFundSetup(testDefaults);
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateMock });
    const action = actions.commitmentReceived(postFundCommitment1, 'sig');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(2, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AcknowledgeFundingSuccess', () => {
  describe('incoming action: FundingSuccessAcknowledged', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_UPDATE, updatedState);
    it('sends PostFundSetupB', () => {
      expectThisCommitmentSent(updatedState, {
        commitmentType: fmgCore.CommitmentType.PostFundSetup,
        commitmentCount: 1,
      });
    });
  });

  describe('incoming action: FundingSuccessAcknowledged', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_UPDATE, updatedState);
    itSendsThisMessage(updatedState, outgoing.FUNDING_SUCCESS);
    it('sends PostFundSetupB', () => {
      expectThisCommitmentSent(updatedState, {
        commitmentType: fmgCore.CommitmentType.PostFundSetup,
        commitmentCount: 1,
      });
    });
  });
});

function itTransitionsFundingStateToType(type: any, state: NextChannelState<states.ChannelState>) {
  return itTransitionsToStateType(
    type,
    (state.channelState as states.OpenedChannelState).fundingState,
  );
}

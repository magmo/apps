import { TwoPartyPlayerIndex } from '../../../../types';
import * as actions from '../actions';
import * as states from '../states';

import { bigNumberify } from 'ethers/utils';
import { FundingStrategy } from '../..';
import {
  appCommitment,
  asAddress,
  asPrivateKey,
  bsAddress,
  channelId,
  ledgerCommitment,
} from '../../../../../domain/commitments/__tests__';
import { channelFromCommitments } from '../../../../channel-store/channel-state/__tests__';
import { EMPTY_SHARED_DATA, setChannels } from '../../../../state';
import * as existingLedgerFundingTests from '../../../existing-ledger-funding/__tests__';
import * as newLedgerFundingTests from '../../../new-ledger-funding/player-a/__tests__';

// To test all paths through the state machine we will use 4 different scenarios:
//
// 1. Happy path: WaitForStrategyChoice
//             -> WaitForStrategyResponse
//             -> WaitForFunding
//             -> WaitForSuccessConfirmation
//             -> Success
//
// 2. WaitForStrategyResponse --> |StrategyRejected| WaitForStrategyChoice
//
// 3. WaitForStrategyChoice   --> |Cancelled| Failure
// 4. WaitForStrategyResponse --> |Cancelled| Failure

// ---------
// Test data
// ---------
const processId = 'process-id.123';
const strategy: FundingStrategy = 'NewLedgerFundingStrategy';
const existingChannelStrategy: FundingStrategy = 'ExistingLedgerFundingStrategy';
const targetChannelId = channelId;
const opponentAddress = bsAddress;
const ourAddress = asAddress;

const props = {
  processId,
  targetChannelId,
  opponentAddress,
  strategy,
  ourAddress,
};

// ----
// States
// ------
const waitForStrategyChoice = states.waitForStrategyChoice(props);

const waitForStrategyResponse = states.waitForStrategyResponse(props);
const waitForIndirectFunding = states.waitForFunding({
  ...props,
  fundingState: newLedgerFundingTests.preSuccessState.state,
});
const waitForExistingChannelFunding = states.waitForFunding({
  ...props,
  fundingState: existingLedgerFundingTests.preSuccess.state,
});
const waitForSuccessConfirmation = states.waitForSuccessConfirmation(props);

const twoTwo = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(2).toHexString() },
];

const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoTwo });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: twoTwo });
const app0 = appCommitment({ turnNum: 0, balances: twoTwo });
const app1 = appCommitment({ turnNum: 1, balances: twoTwo });
// -------
// Shared Data
// -------

const emptySharedData = EMPTY_SHARED_DATA;
const preSuccessSharedData = newLedgerFundingTests.preSuccessState.store;
const successSharedData = newLedgerFundingTests.successState.store;
const existingLedgerInitialSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([ledger4, ledger5], asAddress, asPrivateKey),
  channelFromCommitments([app0, app1], asAddress, asPrivateKey),
]);
// -------
// Actions
// -------
const strategyChosen = actions.strategyChosen({ processId, strategy });
const strategyApproved = actions.strategyApproved({ processId });
const successConfirmed = actions.fundingSuccessAcknowledged({ processId });
const fundingSuccess = newLedgerFundingTests.successTrigger;
const strategyRejected = actions.strategyRejected({ processId });
const cancelledByA = actions.cancelled({ processId, by: TwoPartyPlayerIndex.A });
const cancelledByB = actions.cancelled({ processId, by: TwoPartyPlayerIndex.B });

// ---------
// Scenarios
// ---------
export const newChannelHappyPath = {
  ...props,
  waitForStrategyChoice: {
    state: waitForStrategyChoice,
    sharedData: emptySharedData,
    action: strategyChosen,
  },
  waitForStrategyResponse: {
    state: waitForStrategyResponse,
    sharedData: preSuccessSharedData,
    action: strategyApproved,
  },
  waitForFunding: {
    state: waitForIndirectFunding,
    sharedData: preSuccessSharedData,
    action: fundingSuccess,
  },
  waitForSuccessConfirmation: {
    state: waitForSuccessConfirmation,
    sharedData: successSharedData,
    action: successConfirmed,
  },
};

export const existingChannelHappyPath = {
  ...props,
  strategy: existingChannelStrategy,
  waitForStrategyChoice: {
    state: waitForStrategyChoice,
    sharedData: existingLedgerInitialSharedData,
    action: strategyChosen,
  },
  waitForStrategyResponse: {
    state: waitForStrategyResponse,
    sharedData: existingLedgerInitialSharedData,
    action: strategyApproved,
  },
  waitForFunding: {
    state: waitForExistingChannelFunding,
    sharedData: existingLedgerFundingTests.preSuccess.sharedData,
    action: existingLedgerFundingTests.preSuccess.action,
  },
  waitForSuccessConfirmation: {
    state: waitForSuccessConfirmation,
    sharedData: successSharedData,
    action: successConfirmed,
  },
};

export const rejectedStrategy = {
  ...props,

  waitForStrategyResponse: {
    state: waitForStrategyResponse,
    sharedData: preSuccessSharedData,
    action: strategyRejected,
  },
};

export const cancelledByUser = {
  ...props,
  waitForStrategyChoice: {
    state: waitForStrategyChoice,
    sharedData: emptySharedData,
    action: cancelledByA,
  },
  waitForStrategyResponse: {
    state: waitForStrategyResponse,
    sharedData: preSuccessSharedData,
    action: cancelledByA,
  },
};

export const cancelledByOpponent = {
  ...props,
  waitForStrategyChoice: {
    state: waitForStrategyChoice,
    sharedData: emptySharedData,
    action: cancelledByB,
  },
  waitForStrategyResponse: {
    state: waitForStrategyResponse,
    sharedData: preSuccessSharedData,
    action: cancelledByB,
  },
};

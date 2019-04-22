import * as states from '../state';
import * as withdrawalScenarios from '../../withdrawing/__tests__/scenarios';
import * as testScenarios from '../../../__tests__/test-scenarios';
import {
  ChannelStatus,
  RUNNING,
  WAIT_FOR_UPDATE,
  ChannelState,
} from '../../../channel-state/state';
const processId = 'process-id.123';

const {
  asAddress: address,
  asPrivateKey: privateKey,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  concludeCommitment1,
  concludeCommitment2,
  gameCommitment1,
  gameCommitment2,
} = testScenarios;

const channelStatus: ChannelStatus = {
  address,
  privateKey,
  stage: RUNNING,
  type: WAIT_FOR_UPDATE,
  channelId,
  libraryAddress,
  ourIndex: 0,
  participants,
  channelNonce,
  turnNum: concludeCommitment2.turnNum,
  funded: true,
  lastCommitment: { commitment: concludeCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: concludeCommitment1, signature: '0x0' },
};

const channelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: channelStatus,
  },
};

const notClosedChannelStatus = {
  ...channelStatus,
  lastCommitment: { commitment: gameCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: gameCommitment1, signature: '0x0' },
  turnNum: gameCommitment2.turnNum,
};

const notClosedChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: notClosedChannelStatus,
  },
};

const directlyFundedFundingState = {
  [testScenarios.channelId]: {
    directlyFunded: true,
  },
};
const indirectlyFundedFundingState = {
  [testScenarios.channelId]: {
    directlyFunded: false,
    fundingChannel: '0x0',
  },
};
const waitForWithdrawalStart = states.waitForWithdrawal({
  processId,
  withdrawalState: withdrawalScenarios.happyPath.waitForApproval,
});

const waitForWithdrawalSuccess = states.waitForWithdrawal({
  processId,
  withdrawalState: withdrawalScenarios.happyPath.success,
});

const waitForWithdrawalFailure = states.waitForWithdrawal({
  processId,
  withdrawalState: withdrawalScenarios.failedTransaction.failure,
});

const waitForLedgerDefundingStart = states.waitForLedgerDefunding({
  processId,
  ledgerDefundingState: 'InProgress',
});

const waitForLedgerDefundingSuccess = states.waitForLedgerDefunding({
  processId,
  ledgerDefundingState: 'Success',
});

const waitForLedgerDefundingFailure = states.waitForLedgerDefunding({
  processId,
  ledgerDefundingState: 'Failure',
});

const success = states.success();
const channelNotClosedFailure = states.failure('Channel Not Closed');
const withdrawalFailure = states.failure('Withdrawal Failure');
const ledgerDefundingFailure = states.failure('Ledger De-funding Failure');

export const directlyFundingChannelHappyPath = {
  // States
  waitForWithdrawalStart,
  waitForWithdrawalSuccess,
  success,
  // Shared data
  directlyFundedFundingState,
  channelState,
};

export const indirectlyFundingChannelHappyPath = {
  // States
  waitForLedgerDefundingStart,
  waitForLedgerDefundingSuccess,
  success,
  // Shared data
  indirectlyFundedFundingState,
  channelState,
};

export const channelNotClosed = {
  // States
  waitForWithdrawalStart,
  waitForWithdrawalSuccess,
  failure: channelNotClosedFailure,
  // Shared Data
  directlyFundedFundingState,
  notClosedChannelState,
};

export const directlyFundingFailure = {
  // States
  waitForWithdrawalStart,
  waitForWithdrawalFailure,
  failure: withdrawalFailure,
  // Shared Data
  directlyFundedFundingState,
  channelState,
};

export const indirectlyFundingFailure = {
  // States
  waitForLedgerDefundingStart,
  waitForLedgerDefundingFailure,
  failure: ledgerDefundingFailure,
  // Shared data
  indirectlyFundedFundingState,
  channelState,
};

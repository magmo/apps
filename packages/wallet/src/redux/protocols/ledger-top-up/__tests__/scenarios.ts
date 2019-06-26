import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import {
  noPostFundSetupsPreSuccessA,
  noPostFundSetupsPreSuccessB,
} from '../../direct-funding/__tests__';
import {
  channelId,
  ledgerId,
  asAddress,
  bsAddress,
  ledgerCommitment,
  addressAndPrivateKeyLookup,
} from '../../../../domain/commitments/__tests__';
import { TwoPartyPlayerIndex } from '../../../types';
import { twoPlayerPreSuccessA, twoPlayerPreSuccessB } from '../../consensus-update/__tests__';
import { setChannels } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';

// ---------
// Test data
// ---------

const twoFive = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(5).toHexString() },
];
const oneThree = [
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];

const processId = 'process-id.123';
const props = {
  processId,
  channelId,
  ledgerId,
  proposedAllocation: twoFive.map(a => a.wei),
  originalAllocation: oneThree.map(a => a.wei),
  proposedDestination: twoFive.map(a => a.address),
};

const ledger4 = ledgerCommitment({ turnNum: 4, balances: oneThree });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: oneThree });

// ------
// States
// ------
const switchOrderAndAddATopUpUpdate = states.switchOrderAndAddATopUpUpdate({
  ...props,
  consensusUpdateState: twoPlayerPreSuccessA.state,
});
const waitForDirectFundingForA = states.waitForDirectFundingForA({
  ...props,
  directFundingState: noPostFundSetupsPreSuccessA.state,
});
const restoreOrderAndAddBTopUpUpdate = states.restoreOrderAndAddBTopUpUpdate({
  ...props,
  consensusUpdateState: twoPlayerPreSuccessA.state,
});
const waitForDirectFundingForB = states.waitForDirectFundingForB({
  ...props,
  directFundingState: noPostFundSetupsPreSuccessA.state,
});

// ------
// Actions
// ------

const playerAConsensusUpdateSuccess = twoPlayerPreSuccessA.action;
const playerBConsensusUpdateSuccess = twoPlayerPreSuccessB.action;
const playerAFundingSuccess = noPostFundSetupsPreSuccessA.action;
const playerBFundingSuccess = noPostFundSetupsPreSuccessB.action;

// ------
// Shared Data
// ------
const consensusSharedData = (ourIndex: TwoPartyPlayerIndex) => {
  return ourIndex === TwoPartyPlayerIndex.A
    ? twoPlayerPreSuccessA.sharedData
    : twoPlayerPreSuccessB.sharedData;
};
const fundingSharedData = (ourIndex: TwoPartyPlayerIndex) => {
  return setChannels(
    ourIndex === TwoPartyPlayerIndex.A
      ? noPostFundSetupsPreSuccessA.sharedData
      : noPostFundSetupsPreSuccessB.sharedData,
    [
      channelFromCommitments(
        [ledger4, ledger5],
        addressAndPrivateKeyLookup[ourIndex].address,
        addressAndPrivateKeyLookup[ourIndex].privateKey,
      ),
    ],
  );
};

// ------
// Scenarios
// ------
export const playerAHappyPath = {
  initialize: {
    ...props,
    sharedData: fundingSharedData(TwoPartyPlayerIndex.A),
  },

  switchOrderAndAddATopUpUpdate: {
    state: switchOrderAndAddATopUpUpdate,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.A),
    action: playerAConsensusUpdateSuccess,
  },
  waitForDirectFundingForA: {
    state: waitForDirectFundingForA,
    sharedData: fundingSharedData(TwoPartyPlayerIndex.A),
    action: playerAFundingSuccess,
  },
  restoreOrderAndAddBTopUpUpdate: {
    state: restoreOrderAndAddBTopUpUpdate,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.A),
    action: playerAConsensusUpdateSuccess,
  },
  waitForDirectFundingForB: {
    state: waitForDirectFundingForB,
    sharedData: fundingSharedData(TwoPartyPlayerIndex.A),
    action: playerAFundingSuccess,
  },
};

export const playerBHappyPath = {
  initialize: {
    ...props,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.B),
  },

  switchOrderAndAddATopUpUpdate: {
    state: switchOrderAndAddATopUpUpdate,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.B),
    action: playerBConsensusUpdateSuccess,
  },
  waitForDirectFundingForA: {
    state: waitForDirectFundingForA,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.B),
    action: playerBFundingSuccess,
  },
  restoreOrderAndAddBTopUpUpdate: {
    state: restoreOrderAndAddBTopUpUpdate,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.B),
    action: playerBConsensusUpdateSuccess,
  },
  waitForDirectFundingForB: {
    state: waitForDirectFundingForB,
    sharedData: consensusSharedData(TwoPartyPlayerIndex.B),
    action: playerBFundingSuccess,
  },
};

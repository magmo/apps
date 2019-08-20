import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { EMPTY_SHARED_DATA, setChannels, SharedData } from '../../../state';

import {
  preFailure as DFPreFailure,
  preSuccessA as DFPreSuccessA,
} from '../../direct-funding/__tests__';
import { preSuccess as ACPreSuccess } from '../../advance-channel/__tests__/index';
import {
  appCommitment,
  ledgerCommitment,
  asAddress,
  bsAddress,
  asPrivateKey,
  ledgerId,
  channelId,
} from '../../../../domain/commitments/__tests__';
import { success } from '../../ledger-defunding/states';
import * as _ from 'lodash';
import { NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../reducer';
import { prependToLocator } from '../..';
import { TwoPartyPlayerIndex } from '../../../types';
// -----------
// Commitments
// -----------
const processId = 'processId';

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];

const fiveToApp = [{ address: channelId, wei: bigNumberify(5).toHexString() }];

const app2 = appCommitment({ turnNum: 2, balances: twoThree });
const app3 = appCommitment({ turnNum: 3, balances: twoThree });

const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoThree, proposedBalances: fiveToApp });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: fiveToApp });

const setFundingState = (sharedData: SharedData): SharedData => {
  return {
    ...sharedData,
    fundingState: {
      [ledgerId]: { directlyFunded: true },
    },
  };
};

// Channels

const protocolLocator = NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR;
const props = { channelId, ledgerId, processId, protocolLocator };

// ------
// States
// ------
const waitForPreFundL1 = states.waitForPreFundSetup({
  ...props,
  preFundSetupState: ACPreSuccess.state,
});

const waitForDirectFunding = states.waitForDirectFunding({
  ...props,
  directFundingState: DFPreSuccessA.state,
  postFundSetupState: ACPreSuccess.state,
});

const waitForPostFund1 = states.waitForPostFundSetup({
  ...props,
  postFundSetupState: ACPreSuccess.state,
});
const waitForPreFundSetupSharedData = _.merge(
  ACPreSuccess.sharedData,
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments([app2, app3], asAddress, asPrivateKey),
    channelFromCommitments([ledger4, ledger5], asAddress, asPrivateKey),
  ]),
);
const waitForPostFundSharedData = _.merge(ACPreSuccess.sharedData);
export const successState = {
  state: success({}),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments([app2, app3], asAddress, asPrivateKey),
      channelFromCommitments([ledger4, ledger5], asAddress, asPrivateKey),
    ]),
  ),
};

const waitForDirectFundingFailure = states.waitForDirectFunding({
  ...props,
  directFundingState: DFPreFailure.state,
  postFundSetupState: ACPreSuccess.state,
});
// Since we rely extensively on sub-protocols
// it is not feasible to do player a / player b scenarios
// so we just have the one
export const happyPath = {
  initialParams: {
    sharedData: ACPreSuccess.sharedData,
    processId: 'processId',
    ledgerId,
    startingAllocation: twoThree.map(t => t.wei),
    startingDestination: twoThree.map(t => t.address),
    privateKey: asPrivateKey,
    ourIndex: TwoPartyPlayerIndex.A,
    participants: twoThree.map(t => t.address),
    protocolLocator,
  },
  waitForPreFundL1: {
    state: waitForPreFundL1,
    sharedData: waitForPreFundSetupSharedData,
    action: ACPreSuccess.trigger,
  },
  waitForDirectFunding: {
    state: waitForDirectFunding,
    sharedData: waitForPostFundSharedData,
    action: DFPreSuccessA.action,
  },

  waitForPostFund1: {
    state: waitForPostFund1,
    sharedData: waitForPostFundSharedData,
    action: prependToLocator(ACPreSuccess.trigger, protocolLocator),
  },
};

export const ledgerFundingFails = {
  waitForDirectFunding: {
    state: waitForDirectFundingFailure,
    sharedData: ACPreSuccess.sharedData,
    action: DFPreFailure.action,
  },
};

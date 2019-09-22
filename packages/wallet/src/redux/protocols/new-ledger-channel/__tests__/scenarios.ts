import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import { EMPTY_SHARED_DATA, SharedData } from '../../../state';

import {
  preFailure as DFPreFailure,
  preSuccessA as DFPreSuccessA,
} from '../../direct-funding/__tests__';
import { preSuccess as ACPreSuccess } from '../../advance-channel/__tests__/index';
import {
  appState,
  ledgerState,
  asAddress,
  bsAddress,
  asPrivateKey,
  TWO_PARTICIPANT_LEDGER_CHANNEL,
  channelId,
  convertBalanceToOutcome,
  TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  setChannels,
  channelStateFromStates,
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

const twoThree = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);

const fiveToApp = convertBalanceToOutcome([
  { address: channelId, wei: bigNumberify(5).toHexString() },
]);

const app2 = appState({ turnNum: 2, outcome: twoThree });
const app3 = appState({ turnNum: 3, outcome: twoThree });

const ledger4 = ledgerState({ turnNum: 4, outcome: twoThree, proposedOutcome: fiveToApp });
const ledger5 = ledgerState({ turnNum: 5, outcome: fiveToApp });

const setFundingState = (sharedData: SharedData): SharedData => {
  return {
    ...sharedData,
    fundingState: {
      [TWO_PARTICIPANT_LEDGER_CHANNEL_ID]: { directlyFunded: true },
    },
  };
};

// Channels

const protocolLocator = NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR;
const props = {
  channelId,
  ledgerId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  processId,
  protocolLocator,
};

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
    channelStateFromStates([app2, app3]),
    channelStateFromStates([ledger4, ledger5]),
  ]),
);
const waitForPostFundSharedData = _.merge(ACPreSuccess.sharedData);
export const successState = {
  state: success({}),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelStateFromStates([app2, app3]),
      channelStateFromStates([ledger4, ledger5]),
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
    ledgerId: TWO_PARTICIPANT_LEDGER_CHANNEL,
    startingOutcome: twoThree,
    privateKey: asPrivateKey,
    ourIndex: TwoPartyPlayerIndex.A,
    participants: [asAddress, bsAddress],
    protocolLocator,
    chainId: '0x1',
    challengeDuration: '0x0',
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

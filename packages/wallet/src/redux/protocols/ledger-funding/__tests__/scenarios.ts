import {
  ledgerState,
  asAddress,
  bsAddress,
  channelId,
  appState,
  convertBalanceToOutcome,
  TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  channelStateFromStates,
  setChannels,
  testEmptySharedData,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import { preSuccess as existingLedgerPreSuccess } from '../../existing-ledger-funding/__tests__';
import {
  preSuccessState as newLedgerPreSuccess,
  successTrigger as NewLedgerChannelSuccessTrigger,
  successState as newLedgerSuccess,
} from '../../new-ledger-channel/__tests__';
import { LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../reducer';

const processId = 'processId';

const oneThree = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);
const props = {
  ledgerId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  channelId,
  processId,
  startingOutcome: oneThree,
  protocolLocator: LEDGER_FUNDING_PROTOCOL_LOCATOR,
};
const ledger4 = ledgerState({ turnNum: 4, outcome: oneThree });
const ledger5 = ledgerState({ turnNum: 5, outcome: oneThree });
const app0 = appState({ turnNum: 0, outcome: oneThree });
const app1 = appState({ turnNum: 1, outcome: oneThree });
const existingLedgerFundingSharedData = setChannels(newLedgerSuccess.store, [
  channelStateFromStates([ledger4, ledger5]),
  channelStateFromStates([app0, app1]),
]);
const NewLedgerChannelSharedData = setChannels(testEmptySharedData(), [
  channelStateFromStates([app0, app1]),
]);
const waitForExistingLedgerFunding = states.waitForExistingLedgerFunding({
  ...props,
  existingLedgerFundingState: existingLedgerPreSuccess.state,
});
const waitForNewLedgerChannel = states.waitForNewLedgerChannel({
  ...props,
  newLedgerChannel: newLedgerPreSuccess.state,
});

export const existingLedgerFundingHappyPath = {
  initialize: {
    ...props,
    participants: [asAddress, bsAddress],
    sharedData: existingLedgerFundingSharedData,
  },
};

export const newLedgerChannelHappyPath = {
  initialize: {
    ...props,
    participants: [asAddress, bsAddress],
    sharedData: NewLedgerChannelSharedData,
  },
  waitForNewLedgerChannel: {
    state: waitForNewLedgerChannel,
    action: NewLedgerChannelSuccessTrigger,
    sharedData: newLedgerPreSuccess.sharedData,
  },
  waitForExistingLedgerFunding: {
    state: waitForExistingLedgerFunding,
    action: existingLedgerPreSuccess.action,
    sharedData: existingLedgerPreSuccess.sharedData,
  },
};

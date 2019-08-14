import * as states from '../../states';
import * as actions from '../actions';
import * as testScenarios from '../../../../../domain/commitments/__tests__';
import { EMPTY_SHARED_DATA, setChannels, setFundingState } from '../../../../state';
import { channelFromCommitments } from '../../../../channel-store/channel-state/__tests__';
import { appCommitment, ledgerId } from '../../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils';
import { bsPrivateKey } from '../../../../../communication/__tests__/commitments';
import { twoPlayerPreSuccessA, twoPlayerPreSuccessB } from '../../../consensus-update/__tests__';
import { commitmentReceived } from '../../../../../communication/actions';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, bsAddress, asAddress } = testScenarios;

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];
const fiveToApp = [{ address: channelId, wei: bigNumberify(5).toHexString() }];

const app10 = appCommitment({ turnNum: 10, balances: twoThree, isFinal: true });
const app11 = appCommitment({ turnNum: 11, balances: twoThree, isFinal: true });

const ledger4 = testScenarios.ledgerCommitment({
  turnNum: 4,
  balances: twoThree,
  proposedBalances: fiveToApp,
});
const ledger5 = testScenarios.ledgerCommitment({ turnNum: 5, balances: fiveToApp });
const ledger6 = testScenarios.ledgerCommitment({
  turnNum: 6,
  balances: fiveToApp,
  proposedBalances: twoThree,
});
const ledger7 = testScenarios.ledgerCommitment({ turnNum: 7, balances: twoThree });

// -----------
const app50 = appCommitment({ turnNum: 50, balances: twoThree, isFinal: false });
const app51 = appCommitment({ turnNum: 51, balances: twoThree, isFinal: false });
const app52 = appCommitment({ turnNum: 52, balances: twoThree, isFinal: true });
const app53 = appCommitment({ turnNum: 53, balances: twoThree, isFinal: true });

// --------
// Defaults
// --------
const processId = 'processId';

const defaults = { processId, channelId };

// ------
// SharedData
// ------
const initialStore = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app50, app51], bsAddress, bsPrivateKey),
]);
const initialStoreYourTurn = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app51, app52], bsAddress, bsPrivateKey),
]);
const firstConcludeReceivedChannelState = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app51, app52], bsAddress, bsPrivateKey),
]);
const secondConcludeReceivedChannelState = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app52, app53], bsAddress, bsPrivateKey),
]);
const secondConcludeReceivedWithLedgerChannelChannelState = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app52, app53], bsAddress, bsPrivateKey),
  channelFromCommitments([ledger4, ledger5], bsAddress, bsPrivateKey),
]);

const firstConcludeReceived = setFundingState(firstConcludeReceivedChannelState, channelId, {
  directlyFunded: true,
});
const secondConcludeReceived = setFundingState(secondConcludeReceivedChannelState, channelId, {
  directlyFunded: true,
});

const indirectFundedSecondConcludeReceived = {
  ...setFundingState(secondConcludeReceivedWithLedgerChannelChannelState, channelId, {
    directlyFunded: false,
    fundingChannel: ledgerId,
  }),
};

// ------
// States
// ------
const approveConcluding = states.approveConcluding(defaults);
const decideDefund = states.decideDefund({
  ...defaults,
  consensusUpdateState: twoPlayerPreSuccessB.state,
});

const acknowledgeSuccess = states.acknowledgeSuccess(defaults);
const waitForLedgerUpdate = states.waitForLedgerUpdate({
  ...defaults,
  consensusUpdateState: twoPlayerPreSuccessB.state,
});

// -------
// Actions
// -------
const concludeSent = actions.concludeApproved({ processId });
const defundChosen = actions.defundChosen({ processId });
const acknowledged = actions.acknowledged({ processId });
const keepOpenChosen = actions.keepOpenChosen({ processId });
const ledgerUpdate0Received = commitmentReceived({
  processId,
  signedCommitment: ledger6,
  protocolLocator: [],
});
// -------
// Scenarios
// -------
export const happyPath = {
  ...defaults,
  initialize: { sharedData: initialStore, commitment: app52 },
  approveConcluding: {
    state: approveConcluding,
    sharedData: firstConcludeReceived,
    action: concludeSent,
    reply: app53.commitment,
  },
  decideDefund: { state: decideDefund, sharedData: secondConcludeReceived, action: defundChosen },
};
export const noDefundingHappyPath = {
  ...defaults,
  initialize: { sharedData: initialStore, commitment: app52 },
  approveConcluding: {
    state: approveConcluding,
    sharedData: firstConcludeReceived,
    action: concludeSent,
    reply: app53.commitment,
  },
  decideDefund: {
    state: decideDefund,
    sharedData: indirectFundedSecondConcludeReceived,
    action: keepOpenChosen,
  },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate,
    sharedData: twoPlayerPreSuccessA.sharedData,
    action: twoPlayerPreSuccessA.action,
  },
  acknowledgeSuccess: {
    state: acknowledgeSuccess,
    sharedData: secondConcludeReceived,
    action: acknowledged,
  },
};

export const happyPathAlternative = {
  ...defaults,

  decideDefund: {
    state: decideDefund,
    sharedData: setFundingState(
      setChannels(EMPTY_SHARED_DATA, [
        channelFromCommitments([app10, app11], bsAddress, bsPrivateKey),
        channelFromCommitments([ledger4, ledger5], bsAddress, bsPrivateKey),
      ]),
      channelId,
      { directlyFunded: false, fundingChannel: ledgerId },
    ),
    action: ledgerUpdate0Received,
    reply: ledger7,
  },
};

export const channelDoesntExist = {
  ...defaults,
  initialize: { channelId, sharedData: setChannels(EMPTY_SHARED_DATA, []), commitment: app52 },
  acknowledgeFailure: {
    state: states.acknowledgeFailure({ ...defaults, reason: 'ChannelDoesntExist' }),
    sharedData: initialStore,
    action: acknowledged,
  },
};

export const concludingNotPossible = {
  ...defaults,
  initialize: { sharedData: initialStoreYourTurn, commitment: app53 },
  acknowledgeFailure: {
    state: states.acknowledgeFailure({ ...defaults, reason: 'NotYourTurn' }),
    sharedData: initialStore,
    action: acknowledged,
  },
};

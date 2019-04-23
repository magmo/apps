import * as states from '../states';
import * as actions from '../actions';
import * as channelScenarios from '../../../__tests__/test-scenarios';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, libraryAddress, channelNonce, participants } = channelScenarios;
const channel = { channelId, libraryAddress, channelNonce, participants };
const { asAddress: address, asPrivateKey: privateKey } = channelScenarios;
const participant = { address, privateKey, ourIndex: 0 };
import { ChannelStatus, waitForUpdate } from '../../../channel-state/state';
const channelDefaults = { ...channel, ...participant };
import { setChannel, EMPTY_SHARED_DATA } from '../../../state';

const { signedCommitment19, signedCommitment20, signedCommitment21 } = channelScenarios;

const theirTurn = waitForUpdate({
  ...channelDefaults,
  turnNum: 20,
  lastCommitment: signedCommitment20,
  penultimateCommitment: signedCommitment19,
  funded: true,
});
const ourTurn = waitForUpdate({
  ...channelDefaults,
  turnNum: 21,
  lastCommitment: signedCommitment21,
  penultimateCommitment: signedCommitment20,
  funded: true,
});

// --------
// Defaults
// --------
const processId = 'processId';
const storage = (channelState: ChannelStatus) => setChannel(EMPTY_SHARED_DATA, channelState);

const defaults = { processId, channelId };

// ------
// States
// ------
const approveResignation = states.approveResignation(defaults);
const waitForOpponentConclude = states.waitForOpponentConclude(defaults);
const acknowledgeChannelClosed = states.acknowledgeChannelClosed(defaults);
const waitForDefund = states.waitForDefund(defaults);
const success = states.success();
const acknowledgeResignationImpossible = states.acknowledgeResignationImpossible;
const failure = states.failure({ reason: 'NotYourTurn' });

// -------
// Actions
// -------
const concludeSent = actions.concludeSent(processId);
const concludeReceived = actions.concludeReceived(processId);
const defundChosen = actions.defundChosen(processId);
const defunded = actions.defunded(processId);
const resignationImpossibleAcknowledged = actions.resignationImpossibleAcknowledged(processId);
const defundNotChosen = actions.defundNotChosen(processId);

// -------
// Scenarios
// -------
export const happyPath = {
  ...defaults,
  storage: storage(ourTurn),
  // states
  approveResignation,
  waitForOpponentConclude,
  acknowledgeChannelClosed,
  waitForDefund,
  success,
  // actions
  concludeSent,
  concludeReceived,
  defundChosen,
  defunded,
};

export const resignationNotPossible = {
  ...defaults,
  storage: storage(theirTurn),
  // states
  acknowledgeResignationImpossible,
  failure,
  // actions
  resignationImpossibleAcknowledged,
};

export const closedButNotDefunded = {
  ...defaults,
  storage: storage(ourTurn),
  // states
  acknowledgeChannelClosed,
  success,
  // actions
  defundNotChosen,
};

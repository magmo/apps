import * as states from '../state';
import * as channelScenarios from '../../../__tests__/test-scenarios';
import * as protocolActions from '../../actions';
import * as actions from '../actions';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, asAddress: address, asPrivateKey: privateKey } = channelScenarios;
import { ChannelState } from '../../../channel-store';
import { setChannel, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';

const {
  signedCommitment19,
  signedCommitment20,
  signedCommitment21,
  preFundCommitment0,
} = channelScenarios;
const theirTurn = channelFromCommitments(
  signedCommitment19,
  signedCommitment20,
  address,
  privateKey,
);
const ourTurn = channelFromCommitments(signedCommitment20, signedCommitment21, address, privateKey);

// --------
// Defaults
// --------
const processId = 'processId';
const storage = (channelState: ChannelState) => setChannel(EMPTY_SHARED_DATA, channelState);

const defaults = { processId, channelId };

// ------
// States
// ------
const addressKnown = states.addressKnown(address, privateKey);
const ongoing = states.ongoing(channelId);

// -------
// Actions
// -------
const initializeChannel = protocolActions.initializeChannel();
const receivePreFundSetup = actions.ownCommitmentReceived(processId, preFundCommitment0);
const receiveOurCommitment = actions.ownCommitmentReceived(
  processId,
  signedCommitment20.commitment,
);
const { commitment, signature } = signedCommitment21;
const receiveTheirCommitment = actions.opponentCommitmentReceived(processId, commitment, signature);

// -------
// Scenarios
// -------
export const initializingAChannel = {
  ...defaults,
  storage: { ...EMPTY_SHARED_DATA },
  actions: {
    initializeChannel,
  },
};

export const startingChannel = {
  ...defaults,
  storage: { ...EMPTY_SHARED_DATA },
  states: {
    addressKnown,
  },
  actions: {
    receivePreFundSetup,
  },
};

export const receivingOurCommitment = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    ongoing,
  },
  actions: {
    receiveOurCommitment,
  },
};

export const receivingTheirCommitment = {
  ...defaults,
  storage: storage(theirTurn),
  states: {
    ongoing,
  },
  actions: {
    receiveTheirCommitment,
  },
};

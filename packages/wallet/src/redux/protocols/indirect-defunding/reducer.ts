import { ProtocolStateWithSharedData } from '..';
import { SharedData } from '../../state';
import * as states from './state';
import { IndirectDefundingAction } from './actions';
import { COMMITMENT_RECEIVED } from '../../actions';
import { Commitment } from 'fmg-core/lib/commitment';
import * as helpers from '../reducer-helpers';
import * as channelActions from '../../channel-state/actions';
import { getChannelState } from '../../selectors';
import { unreachable } from '../../../utils/reducer-utils';

export const initialize = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (!helpers.channelIsClosed(channelId, sharedData)) {
    return {
      protocolState: states.failure('Channel Not Closed'),
      sharedData,
    };
  }
  let newSharedData = { ...sharedData };
  if (helpers.isFirstPlayer(channelId, sharedData)) {
    newSharedData = craftFirstLedgerUpdate(newSharedData);
  }
  return {
    protocolState: states.waitForLedgerUpdate({ processId, channelId }),
    sharedData: newSharedData,
  };
};

export const indirectDefundingReducer = (
  protocolState: states.IndirectDefundingState,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  switch (protocolState.type) {
    case states.WAIT_FOR_LEDGER_UPDATE:
      return waitForLedgerUpdateReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_FINAL_LEDGER_UPDATE:
      return waitForFinalLedgerUpdateReducer(protocolState, sharedData, action);
    case states.SUCCESS:
    case states.FAILURE:
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};
const waitForFinalLedgerUpdateReducer = (
  protocolState: states.WaitForFinalLedgerUpdate,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (action.type !== COMMITMENT_RECEIVED) {
    return { protocolState, sharedData };
  }
  let newSharedData = receiveLedgerCommitment(sharedData, action.commitment, action.signature);
  if (!validTransition(sharedData, protocolState.channelId, action.commitment)) {
    return {
      protocolState: states.failure('Received Invalid Commitment'),
      sharedData: newSharedData,
    };
  }
  return { protocolState: states.success(), sharedData: newSharedData };
};
const waitForLedgerUpdateReducer = (
  protocolState: states.WaitForLedgerUpdate,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (action.type !== COMMITMENT_RECEIVED) {
    return { protocolState, sharedData };
  }

  let newSharedData = receiveLedgerCommitment(sharedData, action.commitment, action.signature);
  if (!validTransition(sharedData, protocolState.channelId, action.commitment)) {
    return {
      protocolState: states.failure('Received Invalid Commitment'),
      sharedData: newSharedData,
    };
  }

  if (helpers.isFirstPlayer(protocolState.channelId, newSharedData)) {
    newSharedData = craftFinalLedgerUpdate(newSharedData);
    return {
      protocolState: states.success(),
      sharedData: newSharedData,
    };
  } else {
    newSharedData = craftResponseLedgerUpdate(newSharedData);
    return {
      protocolState: states.waitForFinalLedgerUpdate(protocolState),
      sharedData: newSharedData,
    };
  }
};

const receiveLedgerCommitment = (
  sharedData: SharedData,
  commitment: Commitment,
  signature: string,
): SharedData => {
  return helpers.updateChannelState(
    sharedData,
    channelActions.opponentCommitmentReceived(commitment, signature),
  );
};

// TODO: Once the channel state is simplified we can probably rely on a better check than this
const validTransition = (
  sharedData: SharedData,
  channelId: string,
  commitment: Commitment,
): boolean => {
  return getChannelState(sharedData, channelId).lastCommitment.commitment === commitment;
};

// TODO: Craft these
const craftFirstLedgerUpdate = (sharedData: SharedData): SharedData => {
  return sharedData;
};

const craftResponseLedgerUpdate = (sharedData: SharedData): SharedData => {
  return sharedData;
};

const craftFinalLedgerUpdate = (sharedData: SharedData): SharedData => {
  return sharedData;
};

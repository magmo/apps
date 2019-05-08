import { ProtocolStateWithSharedData } from '..';
import { SharedData, signAndStore, queueMessage } from '../../state';
import * as states from './state';
import { IndirectDefundingAction } from './actions';
import { COMMITMENT_RECEIVED } from '../../actions';
import * as helpers from '../reducer-helpers';
import { unreachable } from '../../../utils/reducer-utils';
import * as selectors from '../../selectors';
import { proposeNewConsensus } from '../../../domain/two-player-consensus-game';
import { sendCommitmentReceived } from '../../../communication';
import { theirAddress } from '../../channel-store';

export const initialize = (
  processId: string,
  channelId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (!helpers.channelIsClosed(channelId, sharedData)) {
    return {
      protocolState: states.failure('Channel Not Closed'),
      sharedData,
    };
  }
  let newSharedData = { ...sharedData };
  if (helpers.isFirstPlayer(ledgerId, sharedData)) {
    const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);

    const theirCommitment = ledgerChannel.lastCommitment.commitment;
    const ourCommitment = proposeNewConsensus(
      theirCommitment,
      proposedAllocation,
      proposedDestination,
    );
    const signResult = signAndStore(sharedData, ourCommitment);
    if (!signResult.isSuccess) {
      return { protocolState: states.failure('Received Invalid Commitment'), sharedData };
    }
    newSharedData = signResult.store;

    const messageRelay = sendCommitmentReceived(
      theirAddress(ledgerChannel),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    newSharedData = queueMessage(newSharedData, messageRelay);
  }
  return {
    protocolState: states.waitForLedgerUpdate({
      processId,
      ledgerId,
      channelId,
      proposedAllocation,
      proposedDestination,
    }),
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
    case states.SUCCESS:
    case states.FAILURE:
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

const waitForLedgerUpdateReducer = (
  protocolState: states.WaitForLedgerUpdate,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (action.type !== COMMITMENT_RECEIVED) {
    throw new Error(`Invalid action ${action.type}`);
  }
  return { protocolState, sharedData };
  // const { commitment, signature } = action.signedCommitment;
  // const newSharedData = receiveLedgerCommitment(sharedData, commitment, signature);
  // if (!validTransition(newSharedData, protocolState.ledgerChannelId, commitment)) {
  //   return {
  //     protocolState: states.failure('Received Invalid Commitment'),
  //     sharedData: newSharedData,
  //   };
  // }
  // const { processId, channelId, proposedAllocation, proposedDestination } = protocolState;
  // if (helpers.isFirstPlayer(protocolState.ledgerChannelId, newSharedData)) {
  //   return {
  //     protocolState: states.success(),
  //     sharedData: newSharedData,
  //   };
  // } else {
  //   // TODO: This needs to be updated to the new consensus game
  //   // newSharedData = craftAndSendLegerUpdate(
  //   //   newSharedData,
  //   //   processId,
  //   //   channelId,
  //   //   proposedAllocation,
  //   //   proposedDestination,
  //   // );
  //   return {
  //     protocolState: states.waitForFinalLedgerUpdate(protocolState),
  //     sharedData: newSharedData,
  //   };
  // }
};

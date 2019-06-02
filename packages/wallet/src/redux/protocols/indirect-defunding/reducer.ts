import { ProtocolStateWithSharedData } from '..';
import { SharedData, signAndStore, queueMessage, checkAndStore } from '../../state';
import * as states from './states';
import { IndirectDefundingAction } from './actions';
import * as helpers from '../reducer-helpers';
import { unreachable } from '../../../utils/reducer-utils';
import * as selectors from '../../selectors';
import { proposeNewConsensus, acceptConsensus } from '../../../domain/two-player-consensus-game';
import { sendCommitmentReceived } from '../../../communication';
import { theirAddress } from '../../channel-store';
import { composeConcludeCommitment } from '../../../utils/commitment-utils';
import { CommitmentReceived } from '../../actions';
import { CommitmentType } from 'fmg-core';
import { initialize as disputeResponderInitialize } from '../dispute/responder/reducer';

export const initialize = (
  processId: string,
  channelId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
  action?: CommitmentReceived,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  if (!helpers.channelIsClosed(channelId, sharedData)) {
    return {
      protocolState: states.failure({ reason: 'Channel Not Closed' }),
      sharedData,
    };
  }
  const newSharedData = { ...sharedData };
  let protocolState;

  if (helpers.isFirstPlayer(ledgerId, sharedData)) {
    // player A
    protocolState = states.confirmLedgerUpdate({
      processId,
      ledgerId,
      channelId,
      proposedAllocation,
      proposedDestination,
      commitmentType: CommitmentType.App,
    });
  }

  if (!helpers.isFirstPlayer(ledgerId, sharedData)) {
    // player B
    protocolState = states.waitForLedgerUpdate({
      processId,
      ledgerId,
      channelId,
      proposedAllocation,
      proposedDestination,
      commitmentType: CommitmentType.App,
    });
    // todo deal with a CommitmentReceived action if it exists
  }
  return {
    protocolState,
    sharedData: newSharedData,
  };
};

export const indirectDefundingReducer = (
  protocolState: states.IndirectDefundingState,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  switch (protocolState.type) {
    case 'IndirectDefunding.WaitForLedgerUpdate':
      return waitForLedgerUpdateReducer(protocolState, sharedData, action);
    case 'IndirectDefunding.ConfirmLedgerUpdate':
      return confirmLedgerUpdateReducer(protocolState, sharedData, action);
    case 'IndirectDefunding.WaitForDisputeChallenger':
    // todo (call dispute reducer)
    case 'IndirectDefunding.WaitForDisputeResponder':
    // todo (call dispute reducer)
    case 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain':
      if (action.type === 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED') {
        return { protocolState: states.successOff({ ...protocolState }), sharedData };
      } else {
        return { protocolState, sharedData };
      }
    case 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain':
      if (action.type === 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED') {
        return { protocolState: states.successOn({ ...protocolState }), sharedData };
      } else {
        return { protocolState, sharedData };
      }
    case 'IndirectDefunding.FinalizedOffChain':
    case 'IndirectDefunding.FinalizedOnChain':
    case 'IndirectDefunding.Failure':
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

const confirmLedgerUpdateReducer = (
  protocolState: states.ConfirmLedgerUpdate,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  let newSharedData = { ...sharedData };
  const { ledgerId, proposedAllocation, proposedDestination, processId } = protocolState;
  switch (action.type) {
    case 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED':
      const playerA = helpers.isFirstPlayer(protocolState.ledgerId, sharedData);
      const conclude = protocolState.commitmentType === CommitmentType.Conclude;
      const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);
      const theirCommitment = ledgerChannel.lastCommitment.commitment;
      const channelState = selectors.getOpenedChannelState(sharedData, ledgerId);
      let ourCommitment;
      let newProtocolState;
      if (playerA && !conclude) {
        ourCommitment = proposeNewConsensus(
          theirCommitment,
          proposedAllocation,
          proposedDestination,
        );
        newProtocolState = states.waitForLedgerUpdate({
          ...protocolState,
          commitmentType: CommitmentType.App,
        });
      }

      if (!playerA && !conclude) {
        ourCommitment = acceptConsensus(theirCommitment);
        newProtocolState = states.waitForLedgerUpdate({
          ...protocolState,
          commitmentType: CommitmentType.Conclude,
        });
      }

      if (playerA && conclude) {
        ourCommitment = composeConcludeCommitment(channelState);
        newProtocolState = states.waitForLedgerUpdate({
          ...protocolState,
          commitmentType: CommitmentType.Conclude,
        });
      }

      if (!playerA && conclude) {
        ourCommitment = composeConcludeCommitment(channelState);
        newProtocolState = states.acknowledgeLedgerFinalizedOffChain({ ...protocolState });
      }

      const signResult = signAndStore(sharedData, ourCommitment);
      if (!signResult.isSuccess) {
        return {
          protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
          sharedData,
        };
      }
      newSharedData = signResult.store;
      const messageRelay = sendCommitmentReceived(
        theirAddress(ledgerChannel),
        processId,
        signResult.signedCommitment.commitment,
        signResult.signedCommitment.signature,
      );
      newSharedData = queueMessage(newSharedData, messageRelay);

      return { protocolState: newProtocolState, sharedData: newSharedData };
    case 'WALLET.INDIRECT_DEFUNDING.LEDGER_CHALLENGE_CREATED': // TODO remove
      const disputeState = disputeResponderInitialize(
        processId,
        ledgerId,
        sharedData,
        action.commitment,
      );
      return {
        protocolState: states.waitForDisputeResponder({
          ...protocolState,
          disputeState: disputeState.protocolState,
        }),
        sharedData: newSharedData,
      };
    default:
      throw new Error(`Invalid action ${action.type}`);
  }
};

const waitForLedgerUpdateReducer = (
  protocolState: states.WaitForLedgerUpdate,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  let newSharedData = { ...sharedData };
  switch (action.type) {
    case 'WALLET.COMMON.COMMITMENT_RECEIVED':
      const checkResult = checkAndStore(newSharedData, action.signedCommitment);
      if (!checkResult.isSuccess) {
        return {
          protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
          sharedData,
        };
      }
      newSharedData = checkResult.store;
      const playerA = helpers.isFirstPlayer(protocolState.ledgerId, sharedData);
      const conclude =
        action.signedCommitment.commitment.commitmentType === CommitmentType.Conclude;

      if (playerA && !conclude) {
        return {
          protocolState: states.confirmLedgerUpdate({
            ...protocolState,
            commitmentType: CommitmentType.Conclude,
          }),
          sharedData: newSharedData,
        };
      }

      if (!playerA && !conclude) {
        return {
          protocolState: states.confirmLedgerUpdate({
            ...protocolState,
            commitmentType: CommitmentType.App,
          }),
          sharedData: newSharedData,
        };
      }

      if (playerA && conclude) {
        return {
          protocolState: states.acknowledgeLedgerFinalizedOffChain({ ...protocolState }),
          sharedData: newSharedData,
        };
      }

      if (!playerA && conclude) {
        return {
          protocolState: states.confirmLedgerUpdate({
            ...protocolState,
            commitmentType: CommitmentType.Conclude,
          }),
          sharedData: newSharedData,
        };
      }
      return {
        protocolState: states.confirmLedgerUpdate({ ...protocolState }),
        sharedData: newSharedData,
      };
    case 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN':
    default:
      throw new Error(`Invalid action ${action.type}`);
  }
};

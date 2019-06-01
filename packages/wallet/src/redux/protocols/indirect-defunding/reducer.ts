import { ProtocolStateWithSharedData } from '..';
import { SharedData, signAndStore, queueMessage, checkAndStore } from '../../state';
import * as states from './states';
import { IndirectDefundingAction } from './actions';
import * as helpers from '../reducer-helpers';
import { unreachable } from '../../../utils/reducer-utils';
import * as selectors from '../../selectors';
import { proposeNewConsensus } from '../../../domain/consensus-app';
import { sendCommitmentReceived } from '../../../communication';
import { theirAddress, getLastCommitment } from '../../channel-store';
import { composeConcludeCommitment } from '../../../utils/commitment-utils';
import { CommitmentReceived } from '../../actions';
import { messageRelayRequested } from 'magmo-wallet-client';
import { defundRequested } from '../actions';
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
  let newSharedData = { ...sharedData };
  let protocolState;
  if (helpers.isFirstPlayer(ledgerId, sharedData)) {
    const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);

    const theirCommitment = getLastCommitment(ledgerChannel);
    const ourCommitment = proposeNewConsensus(
      theirCommitment,
      proposedAllocation,
      proposedDestination,
    );
    const signResult = signAndStore(sharedData, ourCommitment);
    if (!signResult.isSuccess) {
      return {
        protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
        sharedData,
      };
    }
    newSharedData = signResult.store;

    // send a request for opponent to start new defunding process first, because they may not yet have done so
    const actionToRelay = defundRequested({
      channelId,
    });

    const defundRequestedMessageRelay = messageRelayRequested(
      theirAddress(ledgerChannel),
      actionToRelay,
    );

    const commitmentReceivedMessageRelay = sendCommitmentReceived(
      theirAddress(ledgerChannel),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    newSharedData = queueMessage(
      queueMessage(newSharedData, defundRequestedMessageRelay),
      commitmentReceivedMessageRelay,
    );
  }

  if (!helpers.isFirstPlayer && action) {
    // are we second player?
    protocolState = states.confirmLedgerUpdate({
      processId,
      ledgerId,
      channelId,
      proposedAllocation,
      proposedDestination,
      commitmentType: CommitmentType.App,
    });
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
      // const checkResult = checkAndStore(newSharedData, action.signedCommitment);
      // if (!checkResult.isSuccess) {
      //   console.warn('Received Invalid Commitment');
      //   return {
      //     protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
      //     sharedData,
      //   };
      // }
      // newSharedData = checkResult.store;

      if (action.commitmentType === CommitmentType.Conclude) {
        newSharedData = createAndSendConcludeCommitment(
          newSharedData,
          protocolState.processId,
          protocolState.ledgerId,
        );
        // TODO check which player we are
        return {
          protocolState: states.waitForLedgerUpdate({ ...protocolState }),
          sharedData: newSharedData,
        };
      }

      if (action.commitmentType === CommitmentType.App) {
        const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);

        const theirCommitment = ledgerChannel.lastCommitment.commitment;
        const ourCommitment = proposeNewConsensus(
          theirCommitment,
          proposedAllocation,
          proposedDestination,
        );
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

        return {
          protocolState: states.waitForLedgerUpdate({ ...protocolState }),
          sharedData: newSharedData,
        };
      }
      return { protocolState, sharedData }; // should never happen
    case 'WALLET.INDIRECT_DEFUNDING.LEDGER_CHALLENGE_CREATED':
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
      switch (action.signedCommitment.commitment.commitmentType) {
        case CommitmentType.App:
          return { protocolState: states.confirmLedgerUpdate({ ...protocolState }), sharedData };
        case CommitmentType.Conclude:
          return {
            protocolState: states.acknowledgeLedgerFinalizedOffChain({ ...protocolState }),
            sharedData,
          };
      }
      // if (!helpers.isFirstPlayer(protocolState.channelId, sharedData)) {
      //   const theirCommitment = action.signedCommitment.commitment;
      //   const ourCommitment = acceptConsensus(theirCommitment);
      //   const signResult = signAndStore(newSharedData, ourCommitment);
      //   if (!signResult.isSuccess) {
      //     return {
      //       protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
      //       sharedData: newSharedData,
      //     };
      //   }
      //   newSharedData = signResult.store;
      //   const { ledgerId, processId } = protocolState;
      //   const ledgerChannel = selectors.getChannelState(newSharedData, ledgerId);

      //   const messageRelay = sendCommitmentReceived(
      //     theirAddress(ledgerChannel),
      //     processId,
      //     signResult.signedCommitment.commitment,
      //     signResult.signedCommitment.signature,
      //   );
      //   newSharedData = queueMessage(newSharedData, messageRelay);
      // } else {
      //   newSharedData = createAndSendConcludeCommitment(
      //     newSharedData,
      //     protocolState.processId,
      //     protocolState.ledgerId,
      //   );
      // }
      // ^ move to confirmLedgerUpdateReducer
      return {
        protocolState: states.confirmLedgerUpdate({ ...protocolState }),
        sharedData: newSharedData,
      };
    case 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN':
    default:
      throw new Error(`Invalid action ${action.type}`);
  }
};

// Helpers

const createAndSendConcludeCommitment = (
  sharedData: SharedData,
  processId: string,
  channelId: string,
): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const commitment = composeConcludeCommitment(channelState);

  const signResult = signAndStore(sharedData, commitment);
  if (!signResult.isSuccess) {
    throw new Error(`Could not sign commitment due to  ${signResult.reason}`);
  }

  const messageRelay = sendCommitmentReceived(
    theirAddress(channelState),
    processId,
    signResult.signedCommitment.commitment,
    signResult.signedCommitment.signature,
  );
  return queueMessage(signResult.store, messageRelay);
};

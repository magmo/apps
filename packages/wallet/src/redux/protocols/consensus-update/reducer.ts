import { SharedData, signAndStore, getExistingChannel } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, makeLocator } from '..';
import { isConsensusUpdateAction } from './actions';
import * as helpers from '../reducer-helpers';
import {
  proposeNewConsensus,
  acceptConsensus,
  voteForConsensus,
  consensusHasBeenReached,
} from '../../../domain/consensus-app';
import { Commitment } from '../../../domain';
import { appAttributesFromBytes } from 'fmg-nitro-adjudicator/lib/consensus-app';
import { eqHexArray } from '../../../utils/hex-utils';
import { CommitmentsReceived, EmbeddedProtocol } from '../../../communication';
import { WalletAction } from '../../actions';
import { unreachable } from '../../../utils/reducer-utils';

export const CONSENSUS_UPDATE_PROTOCOL_LOCATOR = makeLocator(EmbeddedProtocol.ConsensusUpdate);

export const initialize = (
  processId: string,
  channelId: string,
  clearedToSend: boolean,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  const ourIndex = helpers.getTwoPlayerIndex(channelId, sharedData);
  const safeToSend = helpers.isSafeToSend({ sharedData, channelId, ourIndex, clearedToSend });
  switch (safeToSend) {
    case true:
      try {
        sharedData = sendProposal(
          processId,
          channelId,
          proposedAllocation,
          proposedDestination,
          sharedData,
        );
      } catch (error) {
        return {
          protocolState: states.failure({
            reason: states.FailureReason.Error,
            error: error.message,
          }),
          sharedData,
        };
      }

      return {
        protocolState: states.commitmentSent({
          processId,
          channelId,
          proposedAllocation,
          proposedDestination,
        }),
        sharedData,
      };
    case false:
      return {
        protocolState: states.notSafeToSend({
          processId,
          channelId,
          proposedAllocation,
          proposedDestination,
          clearedToSend,
        }),
        sharedData,
      };
    default:
      return unreachable(safeToSend);
  }
};

export const consensusUpdateReducer = (
  protocolState: states.ConsensusUpdateState,
  sharedData: SharedData,
  action: WalletAction,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  if (!isConsensusUpdateAction(action)) {
    console.warn(`Consensus Update received non Consensus Update action ${action}`);
    return { protocolState, sharedData };
  }
  if (states.isTerminal(protocolState)) {
    console.warn(`Consensus update reducer was called with terminal state ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  switch (action.type) {
    case 'WALLET.COMMON.COMMITMENTS_RECEIVED':
      return handleCommitmentReceived(protocolState, sharedData, action);
    case 'WALLET.CONSENSUS_UPDATE.CLEARED_TO_SEND':
      return handleClearedToSend(protocolState, sharedData);
    default:
      return unreachable(action);
  }
};

const handleClearedToSend = (
  protocolState: states.ConsensusUpdateState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  if (protocolState.type !== 'ConsensusUpdate.CommitmentSent') {
    console.warn(`Consensus update reducer was called with terminal state ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  const { processId, channelId, proposedAllocation, proposedDestination } = protocolState;
  const ourIndex = helpers.getTwoPlayerIndex(channelId, sharedData);
  const safeToSend = helpers.isSafeToSend({ sharedData, channelId, ourIndex, clearedToSend: true });
  if (safeToSend) {
    try {
      if (helpers.isFirstPlayer(channelId, sharedData)) {
        sharedData = sendProposal(
          processId,
          channelId,
          proposedAllocation,
          proposedDestination,
          sharedData,
        );
      } else {
        sharedData = sendAcceptConsensus(processId, channelId, sharedData);
      }
    } catch (error) {
      return {
        protocolState: states.failure({ reason: states.FailureReason.Error, error: error.message }),
        sharedData,
      };
    }
  }

  const latestCommitment = helpers.getLatestCommitment(channelId, sharedData);
  // If we are the last player we would be the one reaching consensus so we check again
  if (consensusReached(latestCommitment, proposedAllocation, proposedDestination)) {
    return { protocolState: states.success({}), sharedData };
  }
  return {
    protocolState: states.commitmentSent({ ...protocolState }),
    sharedData,
  };
};

const handleCommitmentReceived = (
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
  action: CommitmentsReceived,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  const { channelId, processId } = protocolState;

  try {
    const { turnNum } = getExistingChannel(sharedData, channelId);
    sharedData = helpers.checkCommitments(sharedData, turnNum, action.signedCommitments);
  } catch (err) {
    return {
      protocolState: states.failure({
        reason: states.FailureReason.UnableToValidate,
        error: err.message,
      }),
      sharedData,
    };
  }

  const { proposedAllocation, proposedDestination } = protocolState;
  let latestCommitment = helpers.getLatestCommitment(channelId, sharedData);
  if (consensusReached(latestCommitment, proposedAllocation, proposedDestination)) {
    return { protocolState: states.success({}), sharedData };
  }

  if (
    !proposalCommitmentHasExpectedValues(latestCommitment, proposedAllocation, proposedDestination)
  ) {
    return {
      protocolState: states.failure({ reason: states.FailureReason.ProposalDoesNotMatch }),
      sharedData,
    };
  }

  if (helpers.ourTurn(sharedData, channelId)) {
    try {
      sharedData = sendAcceptConsensus(processId, channelId, sharedData);
    } catch (error) {
      return {
        protocolState: states.failure({ reason: states.FailureReason.Error, error: error.message }),
        sharedData,
      };
    }
  }

  latestCommitment = helpers.getLatestCommitment(channelId, sharedData);
  // If we are the last player we would be the one reaching consensus so we check again
  if (consensusReached(latestCommitment, proposedAllocation, proposedDestination)) {
    return { protocolState: states.success({}), sharedData };
  }
  return { protocolState: states.commitmentSent({ ...protocolState }), sharedData };
};

function consensusReached(
  commitment: Commitment,
  expectedAllocation: string[],
  expectedDestination: string[],
): boolean {
  return (
    consensusHasBeenReached(commitment) &&
    eqHexArray(commitment.allocation, expectedAllocation) &&
    eqHexArray(commitment.destination, expectedDestination)
  );
}

function proposalCommitmentHasExpectedValues(
  commitment: Commitment,
  expectedAllocation: string[],
  expectedDestination: string[],
): boolean {
  const { proposedAllocation, proposedDestination } = appAttributesFromBytes(
    commitment.appAttributes,
  );
  return (
    eqHexArray(proposedAllocation, expectedAllocation) &&
    eqHexArray(proposedDestination, expectedDestination)
  );
}
function sendAcceptConsensus(
  processId: string,
  channelId: string,
  sharedData: SharedData,
): SharedData {
  const lastCommitment = helpers.getLatestCommitment(channelId, sharedData);
  const { furtherVotesRequired } = appAttributesFromBytes(lastCommitment.appAttributes);
  const ourCommitment =
    furtherVotesRequired === 1 ? acceptConsensus(lastCommitment) : voteForConsensus(lastCommitment);

  const signResult = signAndStore(sharedData, ourCommitment);
  if (!signResult.isSuccess) {
    throw new Error('Signature Failure');
  }
  sharedData = signResult.store;
  sharedData = helpers.sendCommitments(
    sharedData,
    processId,
    channelId,
    CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
  );
  return sharedData;
}

function sendProposal(
  processId: string,
  channelId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
): SharedData {
  const lastCommitment = helpers.getLatestCommitment(channelId, sharedData);
  const ourCommitment = proposeNewConsensus(
    lastCommitment,
    proposedAllocation,
    proposedDestination,
  );
  const signResult = signAndStore(sharedData, ourCommitment);
  if (!signResult.isSuccess) {
    throw new Error('SignatureFailure');
  }
  sharedData = signResult.store;

  sharedData = helpers.sendCommitments(
    sharedData,
    processId,
    channelId,
    CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
  );
  return sharedData;
}

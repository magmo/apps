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
import { ChannelState } from '../../channel-store';

export const CONSENSUS_UPDATE_PROTOCOL_LOCATOR = makeLocator(EmbeddedProtocol.ConsensusUpdate);

export const initialize = ({
  processId,
  channelId,
  clearedToSend,
  proposedAllocation,
  proposedDestination,
  sharedData,
}: {
  processId: string;
  channelId: string;
  clearedToSend: boolean;
  proposedAllocation: string[];
  proposedDestination: string[];
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  const ourIndex = helpers.getTwoPlayerIndex(channelId, sharedData);
  const safeToSend = helpers.isSafeToSend({ sharedData, channelId, ourIndex, clearedToSend });
  const numParticipants = getExistingChannel(sharedData, channelId).participants.length;
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
          furtherVotesRequired: numParticipants - 2,
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
          furtherVotesRequired: numParticipants - 1,
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
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  if (protocolState.type !== 'ConsensusUpdate.NotSafeToSend') {
    console.warn(`Consensus update reducer was called with terminal state ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  protocolState = { ...protocolState, clearedToSend: true };
  return sendIfSafe(protocolState, sharedData);
};

const handleCommitmentReceived = (
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
  action: CommitmentsReceived,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  const { channelId } = protocolState;

  try {
    const { turnNum } = getExistingChannel(sharedData, channelId);
    sharedData = helpers.checkCommitments(sharedData, turnNum, action.signedCommitments);
  } catch (err) {
    console.error(err.message);
  }

  return sendIfSafe(protocolState, sharedData);
};

function sendIfSafe(
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> {
  const { channelId, processId, proposedAllocation, proposedDestination } = protocolState;
  if (
    consensusReached(
      getExistingChannel(sharedData, channelId),
      proposedAllocation,
      proposedDestination,
    )
  ) {
    return { protocolState: states.success({}), sharedData };
  }

  if (!helpers.ourTurn(sharedData, channelId)) {
    return { protocolState, sharedData };
  }

  switch (protocolState.type) {
    case 'ConsensusUpdate.CommitmentSent':
      return {
        protocolState: states.failure({ reason: states.FailureReason.ConsensusNotReached }),
        sharedData,
      };
    case 'ConsensusUpdate.NotSafeToSend':
      const { clearedToSend } = protocolState;
      if (!clearedToSend) {
        return { protocolState, sharedData };
      }
      try {
        if (
          proposalCommitmentHasExpectedValues(
            helpers.getLatestCommitment(channelId, sharedData),
            proposedAllocation,
            proposedDestination,
          )
        ) {
          sharedData = sendAcceptConsensus(processId, channelId, sharedData);
        } else {
          sharedData = sendProposal(
            processId,
            channelId,
            proposedAllocation,
            proposedDestination,
            sharedData,
          );
        }
      } catch (error) {
        return {
          protocolState: states.failure({
            reason: states.FailureReason.Error,
            error: error.message,
          }),
          sharedData,
        };
      }

      // If we are the last player we would be the one reaching consensus so we check again
      if (
        consensusReached(
          getExistingChannel(sharedData, channelId),
          proposedAllocation,
          proposedDestination,
        )
      ) {
        return { protocolState: states.success({}), sharedData };
      } else {
        return {
          protocolState: states.commitmentSent(protocolState),
          sharedData,
        };
      }
    default:
      return unreachable(protocolState);
  }
}

function consensusReached(
  channel: ChannelState,
  expectedAllocation: string[],
  expectedDestination: string[],
): boolean {
  const { commitments } = channel;
  return !!commitments.find(signedCommitment => {
    const { commitment } = signedCommitment;
    return (
      consensusHasBeenReached(commitment) &&
      eqHexArray(commitment.allocation, expectedAllocation) &&
      eqHexArray(commitment.destination, expectedDestination)
    );
  });
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

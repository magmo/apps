import { SharedData } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData } from '..';
import { ConsensusUpdateAction } from './actions';
import * as helpers from '../reducer-helpers';

import { StatesReceived, ProtocolLocator } from '../../../communication';
import { unreachable } from '../../../utils/reducer-utils';
import { ChannelState } from '../../channel-store';
import { storeStates, storeState } from '../../channel-store/reducer';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';
import { getLastStateForChannel, getLastState, getChannelState } from '../../selectors';
import {
  decodeConsensusData,
  vote,
  propose,
  encodeConsensusData,
} from 'nitro-protocol/lib/src/contract/consensus-data';
export { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../../../communication/protocol-locator';
import _ from 'lodash';
import { SignedState } from 'nitro-protocol';
import { signState } from 'nitro-protocol/lib/src/signatures';
export const initialize = ({
  processId,
  channelId,
  clearedToSend,
  proposedOutcome,
  protocolLocator,
  sharedData,
}: {
  processId: string;
  channelId: string;
  clearedToSend: boolean;

  protocolLocator: ProtocolLocator;
  sharedData: SharedData;
  proposedOutcome: Outcome;
}): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  return sendIfSafe(
    states.notSafeToSend({
      processId,
      channelId,
      proposedOutcome,
      clearedToSend,
      protocolLocator,
    }),
    sharedData,
  );
};

export const consensusUpdateReducer = (
  protocolState: states.ConsensusUpdateState,
  sharedData: SharedData,
  action: ConsensusUpdateAction,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  if (states.isTerminal(protocolState)) {
    console.warn(`Consensus update reducer was called with terminal state ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  switch (action.type) {
    case 'WALLET.COMMON.STATES_RECEIVED':
      return handleStateReceived(protocolState, sharedData, action);
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
    console.warn(`Expected NotSafeToSend state received ${protocolState.type} instead`);
    return { protocolState, sharedData };
  }

  protocolState = { ...protocolState, clearedToSend: true };
  return sendIfSafe(protocolState, sharedData);
};

const handleStateReceived = (
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
  action: StatesReceived,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> => {
  sharedData = storeStates(action.signedStates, sharedData);

  return sendIfSafe(protocolState, sharedData);
};

function sendIfSafe(
  protocolState: states.NonTerminalConsensusUpdateState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ConsensusUpdateState> {
  const { channelId, processId, proposedOutcome, protocolLocator } = protocolState;

  if (consensusReached(getChannelState(sharedData, channelId), proposedOutcome)) {
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
          proposalStateHasExpectedValues(
            getLastStateForChannel(sharedData, channelId),
            proposedOutcome,
          )
        ) {
          sharedData = sendAcceptConsensus(
            processId,
            channelId,
            sharedData.privateKey,
            protocolLocator,
            sharedData,
          );
        } else {
          sharedData = sendProposal(
            processId,
            channelId,
            proposedOutcome,
            protocolLocator,
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
      if (consensusReached(getChannelState(sharedData, channelId), proposedOutcome)) {
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

function consensusReached(channelState: ChannelState, expectedOutcome: Outcome): boolean {
  const latestState = getLastState(channelState);
  const consensusData = decodeConsensusData(latestState.state.appData);
  const { furtherVotesRequired } = consensusData;
  return furtherVotesRequired === 0 && _.isEqual(latestState.state.outcome, expectedOutcome);
}

function proposalStateHasExpectedValues(
  signedState: SignedState,
  expectedOutcome: Outcome,
): boolean {
  // TODO: Is a simple equality check enough
  return _.isEqual(signedState.state.outcome, expectedOutcome);
}
function sendAcceptConsensus(
  processId: string,
  channelId: string,
  privateKey: string,
  protocolLocator: ProtocolLocator,
  sharedData: SharedData,
): SharedData {
  const lastState = getLastStateForChannel(sharedData, channelId).state;
  const { participants } = lastState.channel;
  const consensusData = decodeConsensusData(lastState.appData);
  const { consensusData: newConsensusData } = vote(
    consensusData,
    participants.length,
    lastState.outcome,
  );
  const newAppData = encodeConsensusData(newConsensusData);
  const ourState = { ...lastState, turnNum: lastState.turnNum + 1, appData: newAppData };
  const ourSignedState = signState(ourState, privateKey);
  return storeState(ourSignedState, sharedData);
}

function sendProposal(
  processId: string,
  channelId: string,
  proposedOutcome: Outcome,
  protocolLocator: ProtocolLocator,
  sharedData: SharedData,
): SharedData {
  const lastState = getLastStateForChannel(sharedData, channelId).state;

  const numberOfParticipants = lastState.channel.participants.length;
  const { consensusData: proposalConsensusData } = propose(
    proposedOutcome,
    lastState.outcome,
    numberOfParticipants,
  );
  const ourState = {
    ...lastState,
    turnNum: lastState.turnNum + 1,
    appData: encodeConsensusData(proposalConsensusData),
  };
  const ourSignedState = signState(ourState, sharedData.privateKey);
  sharedData = storeState(ourSignedState, sharedData);
  sharedData = helpers.sendStates(sharedData, processId, channelId, protocolLocator);
  return sharedData;
}

import { CommitmentType } from 'fmg-core/lib/commitment';
import { fundingSuccess, SIGNATURE_SUCCESS, VALIDATION_SUCCESS } from 'magmo-wallet-client';
import * as magmoWalletClient from 'magmo-wallet-client';
import { sendCommitmentsReceived } from '../../communication';
import { Commitment } from '../../domain';
import * as actions from '../actions';
import { Commitments, getLastCommitment, nextParticipant } from '../channel-store';
import { ourTurn as ourTurnOnChannel } from '../channel-store';
import { channelStoreReducer } from '../channel-store/reducer';
import { accumulateSideEffects } from '../outbox';
import { SideEffects } from '../outbox/state';
import * as selectors from '../selectors';
import { checkAndStore, getExistingChannel, queueMessage, SharedData } from '../state';
import { TwoPartyPlayerIndex } from '../types';
export const updateChannelState = (
  sharedData: SharedData,
  channelAction: actions.channel.ChannelAction,
): SharedData => {
  const newSharedData = { ...sharedData };
  const updatedChannelState = channelStoreReducer(newSharedData.channelStore, channelAction);
  newSharedData.channelStore = updatedChannelState.state;
  // TODO: Currently we need to filter out signature/validation messages that are meant to the app
  // This might change based on whether protocol reducers or channel reducers craft commitments
  const filteredSideEffects = filterOutSignatureMessages(updatedChannelState.sideEffects);
  // App channel state may still generate side effects
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, filteredSideEffects);
  return newSharedData;
};

export const filterOutSignatureMessages = (sideEffects?: SideEffects): SideEffects | undefined => {
  if (sideEffects && sideEffects.messageOutbox) {
    let messageArray = Array.isArray(sideEffects.messageOutbox)
      ? sideEffects.messageOutbox
      : [sideEffects.messageOutbox];
    messageArray = messageArray.filter(
      walletEvent =>
        walletEvent.type !== VALIDATION_SUCCESS && walletEvent.type !== SIGNATURE_SUCCESS,
    );
    return {
      ...sideEffects,
      messageOutbox: messageArray,
    };
  }
  return sideEffects;
};

export function sendFundingComplete(sharedData: SharedData, appChannelId: string) {
  const channelState = selectors.getOpenedChannelState(sharedData, appChannelId);
  const c = getLastCommitment(channelState);
  if (c.commitmentType !== CommitmentType.PostFundSetup || c.turnNum !== 3) {
    throw new Error(
      `Expected a post fund setup B commitment. Instead received ${JSON.stringify(c)}.`,
    );
  }
  return queueMessage(sharedData, fundingSuccess(appChannelId, c));
}

export function showWallet(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    displayOutbox: magmoWalletClient.showWallet(),
  });
  return newSharedData;
}

export function hideWallet(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    displayOutbox: magmoWalletClient.hideWallet(),
  });
  return newSharedData;
}

export function sendConcludeSuccess(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.concludeSuccess(),
    // TODO could rename this helper function, as it covers both ways of finalizing a channel
  });
  return newSharedData;
}

export function sendOpponentConcluded(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.opponentConcluded(),
    // TODO could rename this helper function, as it covers both ways of finalizing a channel
  });
  return newSharedData;
}

export function sendCommitments(
  sharedData: SharedData,
  processId: string,
  channelId: string,
  protocolLocator: string,
): SharedData {
  const channel = getExistingChannel(sharedData, channelId);
  const { participants, ourIndex } = channel;
  const messageRelay = sendCommitmentsReceived(
    nextParticipant(participants, ourIndex),
    processId,
    channel.commitments,
    protocolLocator,
  );
  return queueMessage(sharedData, messageRelay);
}

export function checkCommitments(
  sharedData: SharedData,
  turnNum: number,
  commitments: Commitments,
): SharedData {
  // We don't bother checking "stale" commitments -- those whose turnNum does not
  // exceed the current turnNum.

  commitments
    .filter(signedCommitment => signedCommitment.commitment.turnNum > turnNum)
    .map(signedCommitment => {
      const result = checkAndStore(sharedData, signedCommitment);
      if (result.isSuccess) {
        sharedData = result.store;
      } else {
        throw new Error('Unable to validate commitment');
      }
    });

  return sharedData;
}

export function sendChallengeResponseRequested(
  sharedData: SharedData,
  channelId: string,
): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeResponseRequested(channelId),
  });
  return newSharedData;
}

export function sendChallengeCommitmentReceived(sharedData: SharedData, commitment: Commitment) {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeCommitmentReceived(commitment),
  });
  return newSharedData;
}

// TODO 'Complete' here means the challenge was successfully responded to
export function sendChallengeComplete(sharedData: SharedData) {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeComplete(),
  });
  return newSharedData;
}

export function sendConcludeFailure(
  sharedData: SharedData,
  reason: 'Other' | 'UserDeclined',
): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.concludeFailure(reason),
  });
  return newSharedData;
}

export const channelIsClosed = (channelId: string, sharedData: SharedData): boolean => {
  return (
    channelHasConclusionProof(channelId, sharedData) ||
    channelFinalizedOnChain(channelId, sharedData)
  );
};

export const channelHasConclusionProof = (channelId: string, sharedData: SharedData): boolean => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  const [penultimateCommitment, lastCommitment] = channelState.commitments;
  return (
    lastCommitment.commitment.commitmentType === CommitmentType.Conclude &&
    penultimateCommitment.commitment.commitmentType === CommitmentType.Conclude
  );
};

export const channelFinalizedOnChain = (channelId: string, sharedData: SharedData): boolean => {
  const channelState = selectors.getAdjudicatorChannelState(sharedData, channelId);
  return channelState && channelState.finalized;
};

export const isChannelDirectlyFunded = (channelId: string, sharedData: SharedData): boolean => {
  const channelFundingState = selectors.getChannelFundingState(sharedData, channelId);
  if (!channelFundingState) {
    throw new Error(`No funding state for ${channelId}. Cannot determine funding type.`);
  }
  return channelFundingState.directlyFunded;
};

export const getFundingChannelId = (channelId: string, sharedData: SharedData): string => {
  const channelFundingState = selectors.getChannelFundingState(sharedData, channelId);
  if (!channelFundingState) {
    throw new Error(`No funding state for ${channelId}. Cannot determine funding type.`);
  }

  if (!channelFundingState.fundingChannel) {
    throw new Error('No funding channel id defined.');
  }
  return channelFundingState.fundingChannel;
};

export const isFirstPlayer = (channelId: string, sharedData: SharedData) => {
  const channelState = selectors.getChannelState(sharedData, channelId);
  return channelState.ourIndex === TwoPartyPlayerIndex.A;
};

export const isLastPlayer = (channelId: string, sharedData: SharedData) => {
  const channelState = selectors.getChannelState(sharedData, channelId);
  return channelState.ourIndex === channelState.participants.length - 1;
};

export function getOpponentAddress(channelId: string, sharedData: SharedData) {
  const channel = getExistingChannel(sharedData, channelId);

  const { participants } = channel;
  const opponentAddress = participants[(channel.ourIndex + 1) % participants.length];
  return opponentAddress;
}

export function getOurAddress(channelId: string, sharedData: SharedData) {
  const channel = getExistingChannel(sharedData, channelId);
  return channel.participants[channel.ourIndex];
}

export function getLatestCommitment(channelId: string, sharedData: SharedData) {
  const channel = getExistingChannel(sharedData, channelId);
  return getLastCommitment(channel);
}

export function getNumberOfParticipants(commitment: Commitment): number {
  return commitment.channel.participants.length;
}

export function ourTurn(sharedData: SharedData, channelId: string) {
  const channel = getExistingChannel(sharedData, channelId);
  return ourTurnOnChannel(channel);
}

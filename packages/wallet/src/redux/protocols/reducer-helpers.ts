import { Commitment } from 'fmg-core';
import { messageRelayRequested, SIGNATURE_SUCCESS, VALIDATION_SUCCESS } from 'magmo-wallet-client';
import * as channelStates from '../channel-state/state';
import * as actions from '../actions';
import { channelStateReducer } from '../channel-state/reducer';
import { accumulateSideEffects } from '../outbox';
import { SideEffects } from '../outbox/state';
import { SharedData } from '../state';
import { WalletProtocol } from '../types';
import * as selectors from '../selectors';
import { PlayerIndex } from '../types';
import { CommitmentType } from 'fmg-core/lib/commitment';

export const updateChannelState = (
  sharedData: SharedData,
  channelAction: actions.channel.ChannelAction,
): SharedData => {
  const newSharedData = { ...sharedData };
  const updatedChannelState = channelStateReducer(newSharedData.channelState, channelAction);
  newSharedData.channelState = updatedChannelState.state;
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

export const confirmFundingForChannel = (sharedData: SharedData, channelId: string): SharedData => {
  return updateChannelState(sharedData, actions.internal.fundingConfirmed(channelId));
};

export const createCommitmentMessageRelay = (
  protocol: WalletProtocol,
  to: string,
  processId: string,
  commitment: Commitment,
  signature: string,
) => {
  const payload = {
    protocol,
    data: { commitment, signature, processId },
  };
  return messageRelayRequested(to, payload);
};

export function theirAddress(channelState: channelStates.OpenedState) {
  const theirIndex = (channelState.ourIndex + 1) % channelState.participants.length;
  return channelState.participants[theirIndex];
}

export const channelIsClosed = (channelId: string, sharedData: SharedData): boolean => {
  return (
    channelHasConclusionProof(channelId, sharedData) ||
    channelFinalizedOnChain(channelId, sharedData)
  );
};

export const channelHasConclusionProof = (channelId: string, sharedData: SharedData): boolean => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  const { lastCommitment, penultimateCommitment } = channelState;
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

export const isFirstPlayer = (channelId: string, sharedData: SharedData) => {
  const channelState = selectors.getChannelState(sharedData, channelId);
  return channelState.ourIndex === PlayerIndex.A;
};

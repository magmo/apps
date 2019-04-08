import * as walletStates from '../state';
import * as selectors from '../selectors';
import * as channelStates from '../channel-state/state';

import * as actions from '../actions';
import * as channelActions from '../channel-state/actions';

import { channelStateReducer } from '../channel-state/reducer';
import { accumulateSideEffects } from '../outbox';
import { directFundingStoreReducer } from '../direct-funding-store/reducer';
import { Commitment } from 'fmg-core';
import { composePostFundCommitment } from '../../utils/commitment-utils';
import { WalletProcedure } from '../types';
import { messageRelayRequested } from 'magmo-wallet-client';
import { addHex } from '../../utils/hex-utils';
import { bigNumberify } from 'ethers/utils';

export const appChannelIsWaitingForFunding = (
  state: walletStates.Initialized,
  channelId: string,
): boolean => {
  const appChannel = selectors.getOpenedChannelState(state, channelId);
  return appChannel.type === channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP;
};

export const ledgerChannelIsWaitingForUpdate = (
  state: walletStates.Initialized,
  ledgerChannelId: string,
): boolean => {
  const ledgerChannel = selectors.getOpenedChannelState(state, ledgerChannelId);
  return ledgerChannel.type === channelStates.WAIT_FOR_UPDATE;
};

export const ledgerChannelFundsAppChannel = (
  state: walletStates.Initialized,
  appChannelId: string,
  ledgerChannelId: string,
): boolean => {
  const ledgerChannelState = selectors.getOpenedChannelState(state, ledgerChannelId);
  const appChannelState = selectors.getOpenedChannelState(state, ledgerChannelId);
  const lastCommitment = ledgerChannelState.lastCommitment.commitment;
  const { allocation, destination } = lastCommitment;
  const indexOfTargetChannel = destination.indexOf(appChannelId);
  const appChannelTotal = appChannelState.lastCommitment.commitment.allocation.reduce(addHex);

  return bigNumberify(allocation[indexOfTargetChannel]).gte(appChannelTotal);
};

// Global state updaters
export const receiveLedgerCommitment = (
  state: walletStates.Initialized,
  commitment: Commitment,
  signature: string,
): walletStates.Initialized => {
  return updateChannelState(
    state,
    channelActions.opponentCommitmentReceived(commitment, signature),
  );
};

export const requestDirectFunding = (
  state: walletStates.Initialized,
  ledgerChannelId: string,
): walletStates.Initialized => {
  const ledgerChannelState = selectors.getOpenedChannelState(state, ledgerChannelId);
  const { ourIndex } = ledgerChannelState;
  const { allocation } = ledgerChannelState.lastCommitment.commitment;
  const safeToDeposit = allocation.slice(0, ourIndex).reduce(addHex, '0x0');
  const totalFundingRequested = allocation.reduce(addHex);
  const depositAmount = allocation[ourIndex];

  return updateDirectFundingStatus(
    state,
    actions.internal.directFundingRequested(
      ledgerChannelId,
      safeToDeposit,
      totalFundingRequested,
      depositAmount,
      ourIndex,
    ),
  );
};

export const confirmFundingForAppChannel = (
  state: walletStates.Initialized,
  channelId: string,
): walletStates.Initialized => {
  return updateChannelState(state, actions.internal.fundingConfirmed(channelId));
};

export const initializeChannelState = (
  state: walletStates.Initialized,
  channelId: string,
  address: string,
  privateKey: string,
): walletStates.Initialized => {
  // Create initial channel state for new ledger channel
  state.channelState.initializedChannels[channelId] = channelStates.waitForChannel({
    address,
    privateKey,
  });

  return state;
};

export const updateChannelState = (
  state: walletStates.Initialized,
  channelAction: actions.channel.ChannelAction,
): walletStates.Initialized => {
  const newState = { ...state };
  const updatedChannelState = channelStateReducer(newState.channelState, channelAction);
  newState.channelState = updatedChannelState.state;
  // App channel state may still generate side effects
  newState.outboxState = accumulateSideEffects(
    newState.outboxState,
    updatedChannelState.sideEffects,
  );
  return newState;
};

export const updateDirectFundingStatus = (
  state: walletStates.Initialized,
  action: actions.funding.FundingAction,
): walletStates.Initialized => {
  const newState = { ...state };
  const updatedDirectFundingStore = directFundingStoreReducer(state.directFundingStore, action);
  newState.directFundingStore = updatedDirectFundingStore.state;
  return newState;
};

export const receiveLedgerWalletCommitment = (
  state: walletStates.Initialized,
  channelId: string,
  procedure: WalletProcedure,
  commitment: Commitment,
  signature: string,
): walletStates.Initialized => {
  return updateChannelState(
    state,
    actions.commitmentReceived(channelId, procedure, commitment, signature),
  );
};

export const receiveOwnLedgerCommitment = (
  state: walletStates.Initialized,
  commitment: Commitment,
): walletStates.Initialized => {
  return updateChannelState(state, channelActions.ownCommitmentReceived(commitment));
};

export const createAndSendPostFundCommitment = (
  state: walletStates.Initialized,
  ledgerChannelId: string,
): walletStates.Initialized => {
  let newState = { ...state };
  const ledgerChannelState = selectors.getOpenedChannelState(newState, ledgerChannelId);
  const { postFundCommitment, commitmentSignature } = composePostFundCommitment(
    ledgerChannelState.lastCommitment.commitment,
    ledgerChannelState.ourIndex,
    ledgerChannelState.privateKey,
  );

  const theirIndex = (ledgerChannelState.ourIndex + 1) % ledgerChannelState.participants.length;
  const theirAddress = ledgerChannelState.participants[theirIndex];

  newState = receiveOwnLedgerCommitment(state, postFundCommitment);

  newState.outboxState.messageOutbox = [
    createCommitmentMessageRelay(
      theirAddress,
      ledgerChannelId,
      postFundCommitment,
      commitmentSignature,
    ),
  ];
  return newState;
};

export const createCommitmentMessageRelay = (
  to: string,
  channelId: string,
  commitment: Commitment,
  signature: string,
) => {
  const payload = {
    channelId,
    procedure: WalletProcedure.IndirectFunding,
    data: { commitment, signature },
  };
  return messageRelayRequested(to, payload);
};

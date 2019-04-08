import * as states from './state';
import * as walletStates from '../../state';
import * as channelStates from '../../channel-state/state';

import * as actions from '../../actions';

import * as selectors from '../../selectors';

import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex } from '../../types';

import { Channel } from 'fmg-core';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import { addHex } from '../../../utils/hex-utils';
import {
  composeLedgerUpdateCommitment,
  composePreFundCommitment,
} from '../../../utils/commitment-utils';
import { isFundingAction } from '../../internal/actions';
import { CHANNEL_FUNDED } from '../../direct-funding-store/direct-funding-state/state';
import {
  appChannelIsWaitingForFunding,
  initializeChannelState,
  updateDirectFundingStatus,
  receiveLedgerCommitment,
  ledgerChannelIsWaitingForUpdate,
  receiveOwnLedgerCommitment,
  createCommitmentMessageRelay,
  createAndSendPostFundCommitment,
  ledgerChannelFundsAppChannel,
  confirmFundingForAppChannel,
  requestDirectFunding,
  receiveLedgerWalletCommitment,
} from '../reducer-helpers';

export function playerAReducer(
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized {
  if (!state.indirectFunding) {
    return state;
  }

  if (state.indirectFunding.player !== PlayerIndex.A) {
    return state;
  }

  switch (state.indirectFunding.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(state, action);
    case states.WAIT_FOR_PRE_FUND_SETUP_1:
      return waitForPreFundSetup1Reducer(state, action);
    case states.WAIT_FOR_DIRECT_FUNDING:
      return waitForDirectFunding(state, action);
    case states.WAIT_FOR_POST_FUND_SETUP_1:
      return waitForPostFundSetup1(state, action);
    case states.WAIT_FOR_LEDGER_UPDATE_1:
      return waitForLedgerUpdateReducer(state, action);
    default:
      return unreachable(state.indirectFunding);
  }
}

const waitForLedgerUpdateReducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const indirectFundingState = selectors.getIndirectFundingState(
        state,
      ) as states.WaitForLedgerUpdate1;

      // Update ledger state
      let newState = receiveLedgerCommitment(state, action.commitment, action.signature);
      if (
        ledgerChannelFundsAppChannel(
          newState,
          indirectFundingState.channelId,
          indirectFundingState.ledgerId,
        )
      ) {
        newState = confirmFundingForAppChannel(newState, indirectFundingState.channelId);
      }
      return newState;
    default:
      return state;
  }
};

const waitForPostFundSetup1 = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const indirectFundingState = selectors.getIndirectFundingState(
        state,
      ) as states.WaitForPostFundSetup1;

      let newState = receiveLedgerWalletCommitment(
        state,
        action.channelId,
        action.procedure,
        action.commitment,
        action.signature,
      );

      if (ledgerChannelIsWaitingForUpdate(newState, indirectFundingState.ledgerId)) {
        newState = createAndSendUpdateCommitment(
          newState,
          indirectFundingState.channelId,
          indirectFundingState.ledgerId,
        );
        newState.indirectFunding = states.waitForLedgerUpdate1(indirectFundingState);
      }

      return newState;

    default:
      return state;
  }
};
const waitForDirectFunding = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  const indirectFundingState = selectors.getIndirectFundingState(
    state,
  ) as states.WaitForDirectFunding;
  // Funding events currently occur directly against the ledger channel
  if (!isFundingAction(action) || action.channelId !== indirectFundingState.ledgerId) {
    return state;
  } else {
    let newState = updateDirectFundingStatus(state, action);
    if (directFundingIsComplete(newState, action.channelId)) {
      newState = createAndSendPostFundCommitment(newState, action.channelId);
      newState.indirectFunding = states.waitForPostFundSetup1(indirectFundingState);
    }
    return newState;
  }
};

const waitForPreFundSetup1Reducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const indirectFundingState = selectors.getIndirectFundingState(
        state,
      ) as states.WaitForPostFundSetup1;
      let newState = { ...state };
      newState = receiveLedgerCommitment(newState, action.commitment, action.signature);
      if (appChannelIsWaitingForFunding(newState, indirectFundingState.channelId)) {
        newState = requestDirectFunding(newState, indirectFundingState.ledgerId);
        newState.indirectFunding = states.waitForDirectFunding(indirectFundingState);
      }
      return newState;
    default:
      return state;
  }
};

const waitForApprovalReducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  switch (action.type) {
    case actions.indirectFunding.playerA.FUNDING_APPROVED:
      let newState = { ...state };

      const appChannelState = selectors.getOpenedChannelState(state, action.channelId);

      const { state: ledgerChannelState, ledgerChannel } = createLedgerChannel(
        newState,
        appChannelState,
      );
      newState = ledgerChannelState;

      const ledgerChannelId = channelID(ledgerChannel);

      newState = createAndSendPreFundCommitment(newState, appChannelState, ledgerChannel);

      newState.indirectFunding = states.waitForPreFundSetup1({
        channelId: action.channelId,
        ledgerId: ledgerChannelId,
      });

      return newState;
    default:
      return state;
  }
};

const directFundingIsComplete = (state: walletStates.Initialized, channelId: string): boolean => {
  const fundingStatus = selectors.getDirectFundingState(state, channelId);
  return fundingStatus.channelFundingStatus === CHANNEL_FUNDED;
};

const createAndSendUpdateCommitment = (
  state: walletStates.Initialized,
  appChannelId: string,
  ledgerChannelId: string,
): walletStates.Initialized => {
  const appChannelState = selectors.getOpenedChannelState(state, appChannelId);
  const proposedAllocation = [appChannelState.lastCommitment.commitment.allocation.reduce(addHex)];
  const proposedDestination = [appChannelState.channelId];
  // Compose the update commitment
  const ledgerChannelState = selectors.getOpenedChannelState(state, ledgerChannelId);
  const { updateCommitment, commitmentSignature } = composeLedgerUpdateCommitment(
    ledgerChannelState.lastCommitment.commitment,
    ledgerChannelState.ourIndex,
    proposedAllocation,
    proposedDestination,
    ledgerChannelState.privateKey,
  );

  // Update our ledger channel with the latest commitment
  const newState = receiveOwnLedgerCommitment(state, updateCommitment);

  // Send out the commitment to the opponent
  newState.outboxState.messageOutbox = [
    createCommitmentMessageRelay(
      ledgerChannelState.participants[PlayerIndex.B],
      appChannelId,
      updateCommitment,
      commitmentSignature,
    ),
  ];
  return newState;
};

const createAndSendPreFundCommitment = (
  state: walletStates.Initialized,
  appChannelState: channelStates.OpenedState,
  ledgerChannel: Channel,
): walletStates.Initialized => {
  let newState = { ...state };
  // Create prefund commitment
  const { allocation, destination } = appChannelState.lastCommitment.commitment;
  const { preFundSetupCommitment, commitmentSignature } = composePreFundCommitment(
    ledgerChannel,
    allocation,
    destination,
    appChannelState.ourIndex,
    appChannelState.privateKey,
  );

  // Update state
  newState = receiveOwnLedgerCommitment(newState, preFundSetupCommitment);

  // Message opponent
  newState.outboxState.messageOutbox = [
    createCommitmentMessageRelay(
      appChannelState.participants[PlayerIndex.B],
      appChannelState.channelId,
      preFundSetupCommitment,
      commitmentSignature,
    ),
  ];
  return newState;
};

const createLedgerChannel = (
  state: walletStates.Initialized,
  appChannelState: channelStates.OpenedState,
): { state: walletStates.Initialized; ledgerChannel: Channel } => {
  const nonce = 4; // TODO: Make random
  const { participants } = appChannelState;
  const ledgerChannel: Channel = {
    channelType: state.consensusLibrary,
    nonce,
    participants, // TODO: In the future we can use different participants
  };
  const ledgerChannelId = channelID(ledgerChannel);
  const updatedState = initializeChannelState(
    state,
    ledgerChannelId,
    appChannelState.address,
    appChannelState.privateKey,
  );
  return { state: updatedState, ledgerChannel };
};

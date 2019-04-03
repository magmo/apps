import * as walletStates from '../../state';
import * as states from './state';
import * as actions from '../../actions';
import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex, WalletProcedure } from '../../types';

import { Channel, CommitmentType } from 'fmg-core';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import * as channelState from '../../channel-state/state';
import { Commitment } from 'fmg-core/lib/commitment';
import { signCommitment } from '../../../utils/signing-utils';
import { bytesFromAppAttributes, appAttributesFromBytes } from 'fmg-nitro-adjudicator';
import { channelStateReducer } from '../../channel-state/reducer';
import * as channelActions from '../../channel-state/actions';
import { messageRelayRequested } from 'magmo-wallet-client';
import * as selectors from '../../selectors';
import { fundingStateReducer } from '../../funding-state/reducer';
import { CHANNEL_FUNDED } from '../../funding-state/state';
import * as channelStates from '../../channel-state/state';
import { addHex } from '../../../utils/hex-utils';

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
      return waitForLedgerUpdateReducer(state,action);
    default:
      return unreachable(state.indirectFunding);
  }
}

const waitForLedgerUpdateReducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
return state;
};

const waitForPostFundSetup1 = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const newState = { ...state };
      const indirectFundingState = selectors.getIndirectFundingState(
        state,
      ) as states.WaitForPostFundSetup1;
      updateChannelState(
        newState,
        channelActions.opponentCommitmentReceived(action.commitment, action.signature),
      );

      const ledgerChannel = selectors.getOpenedChannelState(state, indirectFundingState.ledgerId);

      if (ledgerChannel.type !== channelStates.WAIT_FOR_UPDATE) {
        return newState;
      } else {
        const appChannel = selectors.getOpenedChannelState(state, indirectFundingState.channelId);
        const proposedAllocation = [
          calculateChannelTotal(appChannel.lastCommitment.commitment.allocation),
        ];
        const proposedDestination = [appChannel.channelId];

        const { updateCommitment, commitmentSignature } = composeLedgerUpdateCommitment(
          ledgerChannel.lastCommitment.commitment,
          ledgerChannel.ourIndex,
          proposedAllocation,
          proposedDestination,
          ledgerChannel.privateKey,
        );

        updateChannelState(newState, channelActions.ownCommitmentReceived(updateCommitment));
        newState.outboxState.messageOutbox = [
          createCommitmentMessageRelay(
            ledgerChannel.participants[PlayerIndex.B],
            indirectFundingState.ledgerId,
            updateCommitment,
            commitmentSignature,
          ),
        ];
        return newState;
      }

    default:
      return state;
  }
};
const waitForDirectFunding = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  const indirectFundingState = selectors.getIndirectFundingState(
    state,
  ) as states.WaitForDirectFunding;
  switch (action.type) {
    case actions.funding.FUNDING_RECEIVED_EVENT:
      // We only want to handle our ledger channel being funded.
      if (action.channelId !== indirectFundingState.ledgerId) {
        return state;
      }
      const newState = { ...state };
      // Update the funding state
      updateFundingState(newState, action);
      const fundingStatus = selectors.getDirectFundingStatus(
        newState,
        indirectFundingState.channelId,
      );

      if (fundingStatus.channelFundingStatus === CHANNEL_FUNDED) {
        const ledgerChannel = selectors.getOpenedChannelState(
          newState,
          indirectFundingState.ledgerId,
        );
        const { postFundCommitment, commitmentSignature } = composePostFundCommitment(
          ledgerChannel.lastCommitment.commitment,
          ledgerChannel.ourIndex,
          ledgerChannel.privateKey,
        );

        // Update ledger state
        updateChannelState(newState, channelActions.ownCommitmentReceived(postFundCommitment));
        // Update our indirect funding state
        newState.indirectFunding = states.waitForPostFundSetup1(indirectFundingState);

        // Message opponent
        newState.outboxState.messageOutbox = [
          createCommitmentMessageRelay(
            ledgerChannel.participants[PlayerIndex.B],
            indirectFundingState.ledgerId,
            postFundCommitment,
            commitmentSignature,
          ),
        ];
      }
      return newState;
    default:
      return state;
  }
};
const waitForPreFundSetup1Reducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  const indirectFundingState = selectors.getIndirectFundingState(
    state,
  ) as states.WaitForPostFundSetup1;
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const newState = { ...state };
      updateChannelState(
        newState,
        channelActions.opponentCommitmentReceived(action.commitment, action.signature),
      );
      const appChannel = selectors.getOpenedChannelState(state, indirectFundingState.channelId);
      if (appChannel.type === channelState.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP) {
        // TODO: Start direct funding
      }

      newState.indirectFunding = states.waitForDirectFunding(indirectFundingState);
      return newState;
    default:
      return state;
  }
};

const waitForApprovalReducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  const indirectFundingState = selectors.getIndirectFundingState(state);
  switch (action.type) {
    case actions.indirectFunding.playerA.FUNDING_APPROVED:
      const newState = { ...state };
      const appChannel = selectors.getOpenedChannelState(state, indirectFundingState.channelId);

      // Create new ledger channel
      const nonce = 4; // TODO: Make random
      const { participants } = appChannel;
      const ledgerChannel: Channel = {
        channelType: newState.consensusLibrary,
        nonce,
        participants,
      };
      const ledgerChannelId = channelID(ledgerChannel);
      initializeChannelState(newState, ledgerChannelId, appChannel.address, appChannel.privateKey);

      // Create prefund commitment
      const { allocation, destination } = appChannel.lastCommitment.commitment;
      const { preFundSetupCommitment, commitmentSignature } = composePreFundCommitment(
        ledgerChannel,
        allocation,
        destination,
        appChannel.ourIndex,
        appChannel.privateKey,
      );

      // Update state
      updateChannelState(newState, channelActions.ownCommitmentReceived(preFundSetupCommitment));
      newState.indirectFunding = states.waitForPreFundSetup1({
        channelId: indirectFundingState.channelId,
        ledgerId: ledgerChannelId,
      });

      // Message opponent
      newState.outboxState.messageOutbox = [
        createCommitmentMessageRelay(
          participants[PlayerIndex.B],
          appChannel.channelId,
          preFundSetupCommitment,
          commitmentSignature,
        ),
      ];
      return newState;
    default:
      return state;
  }
};

// TODO: These are utility methods that can be shared by player A/B

export const calculateChannelTotal = (allocation: string[]): string => {
  let total = '0x0';
  allocation.forEach(amount => {
    total = addHex(total, amount);
  });
  return total;
};

// Communication helper

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

// State updaters

export const initializeChannelState = (
  state: walletStates.Initialized,
  channelId: string,
  address: string,
  privateKey: string,
) => {
  // Create initial channel state for new ledger channel
  state.channelState.initializedChannels[channelId] = channelState.waitForChannel({
    address,
    privateKey,
  });
};
export const updateChannelState = (
  state: walletStates.Initialized,
  channelAction: actions.channel.ChannelAction,
) => {
  // Assumes that no sideEffects are generated by channel reducer
  const updatedChannelState = channelStateReducer(state.channelState, channelAction);
  state.channelState = updatedChannelState.state;
};

export const updateFundingState = (
  state: walletStates.Initialized,
  action: actions.funding.FundingAction,
) => {
  const updatedFundingState = fundingStateReducer(state.fundingState, action);
  state.fundingState = updatedFundingState.state;
};


export const hasConsensusBeenReached=(commitment:Commitment)=>{
  const appAttributes = appAttributesFromBytes(commitment.appAttributes);
  if (appAttributes.)
};

// Commitment composers

export const composeLedgerUpdateCommitment = (
  lastCommitment: Commitment,
  ourIndex: PlayerIndex,
  proposedAllocation: string[],
  proposedDestination: string[],
  privateKey: string,
) => {
  const { channel, turnNum: previousTurnNum, allocation, destination } = lastCommitment;
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation,
    proposedDestination,
    consensusCounter: ourIndex,
  });
  const updateCommitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PostFundSetup,
    turnNum: previousTurnNum + 1,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const commitmentSignature = signCommitment(updateCommitment, privateKey);

  return { updateCommitment, commitmentSignature };
};

export const composePostFundCommitment = (
  lastCommitment: Commitment,
  ourIndex: PlayerIndex,
  privateKey: string,
) => {
  const {
    channel,
    turnNum: previousTurnNum,
    allocation,
    destination,
    appAttributes,
  } = lastCommitment;
  const postFundCommitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PostFundSetup,
    turnNum: previousTurnNum + 1,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const commitmentSignature = signCommitment(postFundCommitment, privateKey);

  return { postFundCommitment, commitmentSignature };
};
export const composePreFundCommitment = (
  channel: Channel,
  allocation: string[],
  destination: string[],
  ourIndex: PlayerIndex,
  privateKey: string,
) => {
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation: allocation,
    proposedDestination: destination,
    consensusCounter: ourIndex,
  });
  const preFundSetupCommitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PreFundSetup,
    turnNum: ourIndex,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const commitmentSignature = signCommitment(preFundSetupCommitment, privateKey);

  return { preFundSetupCommitment, commitmentSignature };
};

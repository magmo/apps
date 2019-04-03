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
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator';
import { channelStateReducer } from '../../channel-state/reducer';
import * as channelActions from '../../channel-state/actions';
import { messageRelayRequested } from 'magmo-wallet-client';
import * as selectors from '../../selectors';

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
    // progress direct funding
    // if direct funding is finished:
    //   send and/or wait for post-fund setup
    case states.WAIT_FOR_POST_FUND_SETUP_1:
    case states.WAIT_FOR_LEDGER_UPDATE_1:
      return state;
    default:
      return unreachable(state.indirectFunding);
  }
}

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
        PlayerIndex.A,
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

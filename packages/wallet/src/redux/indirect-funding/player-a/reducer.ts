import * as walletStates from '../../state';
import * as states from './state';
import * as actions from '../../actions';
import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex, WalletProcedure } from '../../types';
import { OpenedState } from '../../channelState/state';
import { Channel, CommitmentType } from 'fmg-core';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import * as channelState from '../../channelState/state';
import { Commitment } from 'fmg-core/lib/commitment';
import { signCommitment } from '../../../utils/signing-utils';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator';
import { channelStateReducer } from '../../channelState/reducer';
import * as channelActions from '../../channelState/actions';
import { messageRelayRequested } from 'magmo-wallet-client';

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
    // pass the commitment to the channel state reducer
    // update channel state based on outcome
    // if ready to fund:
    //   initiate direct funding
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

const waitForApprovalReducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  const indirectFundingState = state.indirectFunding as states.WaitForApproval;
  switch (action.type) {
    case actions.indirectFunding.playerA.FUNDING_APPROVED:
      const appChannel: OpenedState = state.channelState[indirectFundingState.channelId];
      // Create new ledger channel
      const nonce = 4; // TODO: Make random
      const { participants } = appChannel;
      const ledgerChannel: Channel = { channelType: state.consensusLibrary, nonce, participants };
      const ledgerChannelId = channelID(ledgerChannel);
      const { allocation, destination } = appChannel.lastCommitment.commitment;
      // Create initial channel state for new ledger channel
      state.channelState.initializedChannels[ledgerChannelId] = channelState.waitForChannel({
        ...appChannel,
      });

      // Create prefund commitment
      const { preFundSetupCommitment, commitmentSignature } = composePreFundCommitment(
        ledgerChannel,
        allocation,
        destination,
        PlayerIndex.A,
        appChannel.privateKey,
      );

      // Update channel and indirectFunding state
      state.channelState = channelStateReducer(
        state.channelState,
        channelActions.ownCommitmentReceived(preFundSetupCommitment),
      ).state;
      state.indirectFunding = states.waitForPreFundSetup1({
        channelId: indirectFundingState.channelId,
        ledgerId: ledgerChannelId,
      });
      // Message opponent
      const payload = {
        channelId: indirectFundingState.channelId,
        procedure: WalletProcedure.IndirectFunding,
        data: { commitment: preFundSetupCommitment, signature: commitmentSignature },
      };
      state.outboxState.messageOutbox = [messageRelayRequested(participants[1], payload)];
      return state;
    default:
      return state;
  }
};
// TODO: This can be shared by player A and player B
export const composePreFundCommitment = (
  channel: Channel,
  allocation: string[],
  destination: string[],
  ourIndex: number,
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

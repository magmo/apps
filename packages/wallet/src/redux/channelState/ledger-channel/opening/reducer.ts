import * as channelStates from '../state';
import * as actions from '../../../actions';

import { unreachable } from '../../../../utils/reducer-utils';
import { Channel } from 'fmg-core';
import { channelID } from 'fmg-core/lib/channel';
import { StateWithSideEffects } from '../../../shared/state';
import * as internalActions from '../../../internal/actions';
import { SignedCommitment } from '../../shared/state';
import { addHex } from '../../../../utils/hex-utils';
import {
  composeConsensusPreFundCommitment,
  validPreFundSetupCommitment,
} from '../../shared/commitment-helpers';

export const openingReducer = (
  state: channelStates.OpeningState,
  action: actions.WalletAction,
): StateWithSideEffects<channelStates.LedgerChannelStatus> => {
  switch (state.type) {
    case channelStates.SEND_INITIAL_PRE_FUND_SETUP:
      return sendInitialPreFundSetupReducer(state, action);
    case channelStates.WAIT_FOR_PRE_FUND_SETUP:
      return waitForPreFundSetupReducer(state, action);
    case channelStates.WAIT_FOR_INITIAL_PRE_FUND_SETUP:
      return waitForInitialPreFundSetupReducer(state, action);
    default:
      return unreachable(state);
  }
};

const waitForInitialPreFundSetupReducer = (
  state: channelStates.WaitForInitialPreFundSetup,
  action: internalActions.OpenLedgerChannel | actions.WalletAction,
): StateWithSideEffects<
  channelStates.WaitForInitialPreFundSetup | channelStates.WaitForFundingAndPostFundSetup
> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      const ourIndex = commitment.channel.participants.indexOf(state.address);
      if (
        !validPreFundSetupCommitment(
          action.commitment,
          action.signature,
          ourIndex,
          commitment.channel.participants,
        )
      ) {
        return { state };
      }
      const {
        preFundSetupCommitment,
        commitmentSignature,
        sendCommitmentAction,
      } = composeConsensusPreFundCommitment(
        commitment.channel,
        commitment.allocation,
        commitment.destination,
        ourIndex,
        state.privateKey,
      );
      const channelId = channelID(commitment.channel);
      const { allocation } = commitment;

      return {
        state: channelStates.waitForFundingAndPostFundSetup({
          ...state,
          channelId: channelID(commitment.channel),
          libraryAddress: commitment.channel.channelType,
          channelNonce: commitment.channel.nonce,
          ourIndex,
          funded: false,
          participants: commitment.channel.participants as [string, string],
          turnNum: commitment.turnNum + 1,
          penultimateCommitment: { commitment, signature },
          lastCommitment: {
            commitment: preFundSetupCommitment,
            signature: commitmentSignature,
          },
        }),
        sideEffects: {
          messageOutbox: sendCommitmentAction,
          actionOutbox: [
            internalActions.ledgerChannelOpen(state.appChannelId, channelID(commitment.channel)),
            createDirectFundingRequest(channelId, allocation, ourIndex),
          ],
        },
      };
  }
  return { state };
};
const waitForPreFundSetupReducer = (
  state: channelStates.WaitForPreFundSetup,
  action: internalActions.OpenLedgerChannel | actions.WalletAction,
): StateWithSideEffects<
  channelStates.WaitForPreFundSetup | channelStates.WaitForFundingAndPostFundSetup
> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      if (
        !validPreFundSetupCommitment(
          action.commitment,
          action.signature,
          state.ourIndex,
          state.participants,
        )
      ) {
        return { state };
      }

      return {
        state: channelStates.waitForFundingAndPostFundSetup({
          ...state,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment: action.commitment, signature: action.signature },
        }),
        sideEffects: {
          actionOutbox: [
            internalActions.ledgerChannelOpen(state.appChannelId, state.channelId),
            createDirectFundingRequest(
              state.channelId,
              state.lastCommitment.commitment.allocation,
              state.ourIndex,
            ),
          ],
        },
      };
  }
  return { state };
};
const sendInitialPreFundSetupReducer = (
  state: channelStates.SendInitialPreFundSetup,
  action: internalActions.OpenLedgerChannel | actions.WalletAction,
): StateWithSideEffects<
  channelStates.WaitForPreFundSetup | channelStates.SendInitialPreFundSetup
> => {
  switch (action.type) {
    case internalActions.OPEN_LEDGER_CHANNEL:
      const { channelNonce, ourIndex, participants } = state;
      const channel: Channel = {
        nonce: channelNonce,
        participants,
        channelType: state.libraryAddress,
      };

      const {
        preFundSetupCommitment,
        commitmentSignature,
        sendCommitmentAction,
      } = composeConsensusPreFundCommitment(
        channel,
        state.allocation,
        participants,
        ourIndex,
        state.privateKey,
      );

      const lastCommitment: SignedCommitment = {
        commitment: preFundSetupCommitment,
        signature: commitmentSignature,
      };
      return {
        state: channelStates.waitForPreFundSetup({ ...state, lastCommitment }),
        sideEffects: {
          messageOutbox: sendCommitmentAction,
        },
      };
  }
  return { state };
};

const createDirectFundingRequest = (channelId: string, allocation: string[], ourIndex: number) => {
  const totalFundingRequired = allocation.reduce(addHex);
  const safeToDepositLevel = ourIndex === 0 ? '0x00' : allocation.slice(0, ourIndex).reduce(addHex);
  const ourDeposit = allocation[ourIndex];
  return actions.internal.directFundingRequested(
    channelId,
    safeToDepositLevel,
    totalFundingRequired,
    ourDeposit,
    ourIndex,
  );
};

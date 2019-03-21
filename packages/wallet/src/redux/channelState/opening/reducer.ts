import * as channelStates from '../state';
import * as actions from '../../actions';
import {
  signatureSuccess,
  validationSuccess,
  signatureFailure,
  validationFailure,
  channelInitializationSuccess,
} from 'magmo-wallet-client/lib/wallet-events';

import { unreachable } from '../../../utils/reducer-utils';
import { signCommitment, validCommitmentSignature } from '../../../utils/signing-utils';
import { CommitmentType } from 'fmg-core';
import { channelID } from 'fmg-core/lib/channel';
import { StateWithSideEffects } from '../../shared/state';
import { ethers } from 'ethers';
import { waitForChannel } from './state';

export const openingReducer = (
  state: channelStates.OpeningState,
  action: actions.WalletAction,
): StateWithSideEffects<channelStates.ChannelState> => {
  switch (state.type) {
    case channelStates.WAIT_FOR_ADDRESS:
      return waitForAddressReducer(state, action);
    case channelStates.WAIT_FOR_CHANNEL:
      return waitForChannelReducer(state, action);
    case channelStates.WAIT_FOR_PRE_FUND_SETUP:
      return waitForPreFundSetupReducer(state, action);
    default:
      return unreachable(state);
  }
};

const waitForAddressReducer = (
  state: channelStates.WaitForAddress,
  action: actions.WalletAction,
): StateWithSideEffects<channelStates.WaitForChannel | channelStates.WaitForAddress> => {
  if (action.type === actions.CHANNEL_INITIALIZED) {
    const wallet = ethers.Wallet.createRandom();
    const { address, privateKey } = wallet;

    return {
      state: waitForChannel({ address, privateKey }),
      outboxState: { messageOutbox: channelInitializationSuccess(wallet.address) },
    };
  } else {
    return { state };
  }
};

const waitForChannelReducer = (
  state: channelStates.WaitForChannel,
  action: actions.WalletAction,
): StateWithSideEffects<channelStates.WaitForPreFundSetup | channelStates.WaitForChannel> => {
  switch (action.type) {
    case actions.OWN_COMMITMENT_RECEIVED:
      const ownCommitment = action.commitment;

      // check it's a PreFundSetupA
      if (ownCommitment.commitmentType !== CommitmentType.PreFundSetup) {
        // Since these checks are happening during a signature request we'll return a sig failure
        return {
          state,
          outboxState: {
            messageOutbox: signatureFailure('Other', 'Expected a pre fund setup position.'),
          },
        };
      }
      if (ownCommitment.commitmentCount !== 0) {
        return {
          state,
          outboxState: { messageOutbox: signatureFailure('Other', 'Expected state count to 0.') },
        };
      }

      const ourAddress = ownCommitment.channel.participants[0] as string;

      if (ourAddress !== state.address) {
        return {
          state,
          outboxState: {
            messageOutbox: signatureFailure(
              'Other',
              'Address provided does not match the one stored in the wallet.',
            ),
          },
        };
      }

      const signature = signCommitment(ownCommitment, state.privateKey);
      // if so, unpack its contents into the state
      return {
        state: channelStates.waitForPreFundSetup({
          ...state,
          libraryAddress: ownCommitment.channel.channelType,
          channelId: channelID(ownCommitment.channel),
          ourIndex: ownCommitment.channel.participants.indexOf(state.address),
          participants: ownCommitment.channel.participants as [string, string],
          channelNonce: ownCommitment.channel.nonce,
          turnNum: 0,
          lastCommitment: { commitment: ownCommitment, signature },
          funded: false,
        }),
        outboxState: { messageOutbox: signatureSuccess(signature) },
      };

    case actions.OPPONENT_COMMITMENT_RECEIVED:
      const opponentCommitment = action.commitment;

      // all these checks will fail silently for the time being
      // check it's a PreFundSetupA
      if (opponentCommitment.commitmentType !== CommitmentType.PreFundSetup) {
        return {
          state,
          outboxState: {
            messageOutbox: validationFailure('Other', 'Expected a prefund setup position'),
          },
        };
      }
      if (opponentCommitment.commitmentCount !== 0) {
        return {
          state,
          outboxState: {
            messageOutbox: validationFailure('Other', 'Expected state count to be 0'),
          },
        };
      }

      const ourAddress2 = opponentCommitment.channel.participants[1];
      const opponentAddress2 = opponentCommitment.channel.participants[0] as string;

      if (!validCommitmentSignature(action.commitment, action.signature, opponentAddress2)) {
        return {
          state,
          outboxState: { messageOutbox: validationFailure('InvalidSignature') },
        };
      }

      if (ourAddress2 !== state.address) {
        return {
          state,
          outboxState: {
            messageOutbox: validationFailure(
              'Other',
              'Address provided does not match the one stored in the wallet.',
            ),
          },
        };
      }

      // if so, unpack its contents into the state
      return {
        state: channelStates.waitForPreFundSetup({
          ...state,
          libraryAddress: opponentCommitment.channel.channelType,
          channelId: channelID(opponentCommitment.channel),
          ourIndex: opponentCommitment.channel.participants.indexOf(state.address),
          participants: opponentCommitment.channel.participants as [string, string],
          channelNonce: opponentCommitment.channel.nonce,
          turnNum: 0,
          lastCommitment: { commitment: action.commitment, signature: action.signature },
          funded: false,
        }),
        outboxState: { messageOutbox: validationSuccess() },
      };
    default:
      return { state };
  }
};

const waitForPreFundSetupReducer = (
  state: channelStates.WaitForPreFundSetup,
  action: actions.WalletAction,
): StateWithSideEffects<
  channelStates.WaitForPreFundSetup | channelStates.WaitForFundingRequest
> => {
  switch (action.type) {
    case actions.OWN_COMMITMENT_RECEIVED:
      const ownCommitment = action.commitment;

      // check it's a PreFundSetupB
      if (ownCommitment.commitmentType !== CommitmentType.PreFundSetup) {
        return {
          state,
          outboxState: {
            messageOutbox: signatureFailure('Other', 'Expected a prefund setup position.'),
          },
        };
      }
      if (ownCommitment.commitmentCount !== 1) {
        return {
          state,
          outboxState: {
            messageOutbox: signatureFailure('Other', 'Expected state count to be 1.'),
          },
        };
      }

      const signature = signCommitment(ownCommitment, state.privateKey);

      // if so, unpack its contents into the state
      return {
        state: channelStates.waitForFundingRequest({
          ...state,
          turnNum: 1,
          lastCommitment: { commitment: ownCommitment, signature },
          penultimateCommitment: state.lastCommitment,
          funded: false,
        }),
        outboxState: { messageOutbox: signatureSuccess(signature) },
      };

    case actions.OPPONENT_COMMITMENT_RECEIVED:
      const opponentCommitment = action.commitment;

      // check it's a PreFundSetupB
      if (opponentCommitment.commitmentType !== CommitmentType.PreFundSetup) {
        return {
          state,
          outboxState: {
            messageOutbox: validationFailure('Other', 'Expected a prefund setup position.'),
          },
        };
      }

      if (opponentCommitment.commitmentCount !== 1) {
        return {
          state,
          outboxState: {
            messageOutbox: validationFailure('Other', 'Expected state count to be 1.'),
          },
        };
      }
      const opponentAddress2 = state.participants[1 - state.ourIndex];

      if (!validCommitmentSignature(action.commitment, action.signature, opponentAddress2)) {
        return {
          state,
          outboxState: { messageOutbox: validationFailure('InvalidSignature') },
        };
      }

      // if so, unpack its contents into the state
      return {
        state: channelStates.waitForFundingRequest({
          ...state,
          turnNum: 1,
          lastCommitment: { commitment: action.commitment, signature: action.signature },
          penultimateCommitment: state.lastCommitment,
          funded: false,
        }),
        outboxState: { messageOutbox: validationSuccess() },
      };

    default:
      return { state };
  }
};

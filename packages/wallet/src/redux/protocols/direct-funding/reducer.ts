import { bigNumberify } from 'ethers/utils';
import { Commitment } from 'fmg-core';
import { messageRelayRequested } from 'magmo-wallet-client';
import { composePostFundCommitment } from '../../../utils/commitment-utils';
import { unreachable } from '../../../utils/reducer-utils';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import * as actions from '../../actions';
import * as channelActions from '../../channel-state/actions';
import * as channelStates from '../../channel-state/state';
import { ProtocolReducer, ProtocolStateWithSharedData } from '../../protocols';
import * as selectors from '../../selectors';
import { SharedData } from '../../state';
import { WalletProtocol, PlayerIndex } from '../../types';
import { updateChannelState } from '../indirect-funding/reducer-helpers';
import { isTransactionAction } from '../transaction-submission/actions';
import {
  initialize as initTransactionState,
  transactionReducer,
} from '../transaction-submission/reducer';
import { isTerminal, SUCCESS } from '../transaction-submission/states';
import * as states from './state';

type DFReducer = ProtocolReducer<states.DirectFundingState>;

export const directFundingStateReducer: DFReducer = (
  state: states.DirectFundingState,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT && action.channelId === state.channelId) {
    if (bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)) {
      return fundingReceiveEventReducer(state, sharedData, action);
    }
  }

  switch (state.type) {
    case states.NOT_SAFE_TO_DEPOSIT:
      return notSafeToDepositReducer(state, sharedData, action);
    case states.WAIT_FOR_DEPOSIT_TRANSACTION:
      return waitForDepositTransactionReducer(state, sharedData, action);
    case states.WAIT_FOR_FUNDING_CONFIRMATION_AND_POST_FUND_SETUP:
      return waitForFundingConfirmationAndPostFundSetupReducer(state, sharedData, action);
    case states.FUNDING_SUCCESS:
      return channelFundedReducer(state, sharedData, action);
    default:
      return unreachable(state);
  }
};

// Action reducers
const fundingReceiveEventReducer: DFReducer = (
  state: states.DirectFundingState,
  sharedData: SharedData,
  action: actions.FundingReceivedEvent,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  // If we are player A, the channel is now funded, so we should send the PostFundSetup
  if (state.ourIndex === PlayerIndex.A) {
    const newSharedData = createAndSendPostFundCommitment(sharedData, state.channelId);

    return {
      protocolState: states.waitForFundingConfirmationAndPostFundSetup(state, {
        channelFunded: true,
        postFundSetupReceived: false,
      }),
      sharedData: newSharedData,
    };
  }

  // Player B case
  if (
    state.type === states.WAIT_FOR_FUNDING_CONFIRMATION_AND_POST_FUND_SETUP &&
    state.postFundSetupReceived
  ) {
    // TODO: Need to send post fund setup for player B
    return {
      protocolState: states.fundingSuccess(state),
      sharedData,
    };
  }
  return {
    protocolState: states.waitForFundingConfirmationAndPostFundSetup(state, {
      channelFunded: true,
      postFundSetupReceived: false,
    }),
    sharedData,
  };
};

// State reducers
const notSafeToDepositReducer: DFReducer = (
  state: states.NotSafeToDeposit,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (
        action.channelId === state.channelId &&
        bigNumberify(action.totalForDestination).gte(state.safeToDepositLevel)
      ) {
        const depositTransaction = createDepositTransaction(
          state.channelId,
          state.requestedYourContribution,
        );

        const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
          depositTransaction,
          `direct-funding.${action.channelId}`, // TODO: what is the correct way of fetching the process id?
          sharedData,
        );
        return {
          protocolState: states.waitForDepositTransaction(state, transactionSubmissionState),
          sharedData: newSharedData,
        };
      } else {
        return { protocolState: state, sharedData };
      }
    default:
      return { protocolState: state, sharedData };
  }
};

const waitForDepositTransactionReducer: DFReducer = (
  protocolState: states.WaitForDepositTransaction,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.COMMITMENT_RECEIVED) {
    // Player B scenario:
    // - transaction success has NOT arrived.
    // - funding received event has NOT arrived
    // - Abandon waiting for the transaction since Player A thinks that the channel is funded.
    const updatedSharedData = updateChannelState(sharedData, action);
    return {
      protocolState: states.waitForFundingConfirmationAndPostFundSetup(protocolState, {
        channelFunded: false,
        postFundSetupReceived: true,
      }),
      sharedData: updatedSharedData,
    };
  }

  if (!isTransactionAction(action)) {
    return { protocolState, sharedData };
  }
  const { storage: newSharedData, state: newTransactionState } = transactionReducer(
    protocolState.transactionSubmissionState,
    sharedData,
    action,
  );
  if (!isTerminal(newTransactionState)) {
    return {
      sharedData: newSharedData,
      protocolState: { ...protocolState, transactionSubmissionState: newTransactionState },
    };
  } else {
    if (newTransactionState.type === SUCCESS) {
      return {
        protocolState: states.waitForFundingConfirmationAndPostFundSetup(protocolState, {
          channelFunded: false,
          postFundSetupReceived: false,
        }),
        sharedData,
      };
    } else {
      // TODO: treat the transaction failure case
      return { protocolState, sharedData };
    }
  }
};

const waitForFundingConfirmationAndPostFundSetupReducer: DFReducer = (
  state: states.WaitForFundingConfirmationAndPostFundSetup,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const newSharedData = updateChannelState(sharedData, action);

      if (state.ourIndex === PlayerIndex.A) {
        // If we are player A, we waited for channel funding to send our PostFundSetup.
        // The following will not work if player B sends a preemptive PostFundSetup commitment
        return { protocolState: states.fundingSuccess(state), sharedData: newSharedData };
      }

      // Player B logic
      if (state.channelFunded) {
        // TOO: need to send PostFund setup
        return { protocolState: states.fundingSuccess(state), sharedData: newSharedData };
      }
      return {
        protocolState: states.waitForFundingConfirmationAndPostFundSetup(state, {
          channelFunded: false,
          postFundSetupReceived: true,
        }),
        sharedData: newSharedData,
      };
      break;
    default:
      return { protocolState: state, sharedData };
  }
  return { protocolState: state, sharedData };
};
const channelFundedReducer: DFReducer = (
  state: states.FundingSuccess,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT) {
    if (bigNumberify(action.totalForDestination).lt(state.requestedTotalFunds)) {
      // TODO: Deal with chain re-orgs that de-fund the channel here
      return { protocolState: state, sharedData };
    }
  }
  return { protocolState: state, sharedData };
};

// Helpers
const createAndSendPostFundCommitment = (sharedData: SharedData, channelId: string): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const { commitment, signature } = composePostFundCommitment(
    channelState.lastCommitment.commitment,
    channelState.ourIndex,
    channelState.privateKey,
  );

  let newSharedData = updateChannelState(
    sharedData,
    channelActions.ownCommitmentReceived(commitment),
  );

  newSharedData = {
    ...newSharedData,
    outboxState: {
      ...newSharedData.outboxState,
      messageOutbox: [
        createCommitmentMessageRelay(theirAddress(channelState), channelId, commitment, signature),
      ],
    },
  };
  return newSharedData;
};

const createCommitmentMessageRelay = (
  to: string,
  processId: string,
  commitment: Commitment,
  signature: string,
) => {
  const payload = {
    protocol: WalletProtocol.DirectFunding,
    data: { commitment, signature, processId },
  };
  return messageRelayRequested(to, payload);
};

function theirAddress(channelState: channelStates.OpenedState) {
  const theirIndex = (channelState.ourIndex + 1) % channelState.participants.length;
  return channelState.participants[theirIndex];
}
